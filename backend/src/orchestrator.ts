import { AGENT_IDS, type AgentId, type AgentResult, type TokenContext, type Verdict } from "./types";
import { runAgent } from "./agents";
import { pushEvent } from "./sessions";
import { getSourceCode, getCreatorAndCreationTx, getTxList, summarizeDevActivity } from "./data/bscscan";
import { getFourmemeToken, TRENDING_METAS } from "./data/fourmeme";
import { aggregateScore, tierFor } from "./util/score";
import { pinReasoning } from "./ipfs";
import { recordVerdictOnChain } from "./chain";
import { config } from "./config";
import { log } from "./util/log";

// Pulls all context in parallel, then emits context_ready.
async function gatherContext(sessionId: string, tokenAddress: `0x${string}`): Promise<TokenContext> {
  const [fm, src, creation] = await Promise.all([
    getFourmemeToken(tokenAddress),
    getSourceCode(tokenAddress),
    getCreatorAndCreationTx(tokenAddress),
  ]);

  const creator = (fm?.creator ?? creation.contractCreator ?? undefined) as `0x${string}` | undefined;
  const devTxs = creator ? await getTxList(creator, 50) : [];
  const devSummary = creator ? summarizeDevActivity(devTxs, creator) : { firstTxTimestamp: null, txCount: 0, fundedBy: null };

  const ctx: TokenContext = {
    tokenAddress,
    tokenName: fm?.name,
    tokenSymbol: fm?.symbol,
    creator,
    sourceCode: src?.sourceCode ?? undefined,
    lp: {
      liquidityUsd: fm?.liquidityUsd,
      lpLocked: undefined,
      lpHolderCount: undefined,
    },
    devWallet: creator
      ? {
          address: creator,
          firstTxTimestamp: devSummary.firstTxTimestamp ?? undefined,
          txCount: devSummary.txCount,
          fundedBy: devSummary.fundedBy ?? undefined,
        }
      : undefined,
    holders: { total: fm?.holderCount },
    trendingMetas: TRENDING_METAS,
    mentions: config.mockSentiment
      ? {
          twitterCount: fm?.twitter ? 120 : 0,
          telegramCount: fm?.telegram ? 80 : 0,
          samples: fm?.twitter
            ? [
                "looks like the real deal 👀",
                "ser when LP lock?",
                "sending it, YOLO 🚀🚀🚀",
                "why is CA different from twitter bio??",
              ]
            : [],
        }
      : undefined,
  };

  pushEvent(sessionId, {
    event: "context_ready",
    data: { tokenAddress, tokenName: ctx.tokenName, tokenSymbol: ctx.tokenSymbol },
  });
  return ctx;
}

async function runOneAgent(sessionId: string, agentId: AgentId, ctx: TokenContext): Promise<AgentResult> {
  const result = await runAgent(agentId, {
    ctx,
    onPartial: (partial) => {
      // Stream deltas to the SSE bus so the UI can show typing.
      if (partial.length < 1) return;
      pushEvent(sessionId, { event: "agent_thinking", data: { agent: agentId, partial } });
    },
  });
  pushEvent(sessionId, {
    event: "agent_verdict",
    data: {
      agent: agentId,
      score: result.score,
      reasoning: result.reasoning,
      latencyMs: result.latencyMs,
      error: result.error,
    },
  });
  return result;
}

export async function runAnalysis(sessionId: string, tokenAddress: `0x${string}`, reqId = "-") {
  try {
    log.info("orchestrator start", { reqId, sessionId, tokenAddress });
    pushEvent(sessionId, { event: "session_start", data: { sessionId, tokenAddress } });
    const ctx = await gatherContext(sessionId, tokenAddress);

    // All 5 personas in parallel. Promise.all fail-fast is fine here because
    // runOneAgent swallows errors via its fallback path.
    const results = await Promise.all(AGENT_IDS.map((id) => runOneAgent(sessionId, id, ctx)));

    const overallScore = aggregateScore(results);
    const tier = tierFor(overallScore);
    const agents = Object.fromEntries(
      results.map((r) => [r.agent, { score: r.score, reasoning: r.reasoning }]),
    ) as Verdict["agents"];

    const reasoningDoc = {
      tokenAddress,
      tokenName: ctx.tokenName ?? "",
      tokenSymbol: ctx.tokenSymbol ?? "",
      analysisTimestamp: Math.floor(Date.now() / 1000),
      overallScore,
      tier,
      agents,
      context: {
        creator: ctx.creator,
        liquidityUsd: ctx.lp?.liquidityUsd,
        devWallet: ctx.devWallet,
        holderCount: ctx.holders?.total,
        trendingMetas: ctx.trendingMetas,
      },
    };

    const reasoningIpfsUri = await pinReasoning(reasoningDoc);
    const chain = await recordVerdictOnChain({
      tokenAddress,
      overallScore,
      ipfsUri: reasoningIpfsUri,
      reasoningPayload: reasoningDoc,
    });

    const verdict: Verdict = {
      tokenAddress,
      tokenName: ctx.tokenName ?? "",
      tokenSymbol: ctx.tokenSymbol ?? "",
      analysisTimestamp: Math.floor(Date.now() / 1000),
      overallScore,
      tier,
      agents,
      reasoningIpfsUri,
      verdictNftTokenId: chain.verdictNftTokenId,
      txHash: chain.txHash,
      chainId: chain.chainId,
    };

    pushEvent(sessionId, { event: "final_verdict", data: verdict });
    pushEvent(sessionId, { event: "session_end", data: { sessionId } });
    log.info("orchestrator done", {
      reqId,
      sessionId,
      tokenAddress,
      overallScore,
      tier,
      verdictNftTokenId: chain.verdictNftTokenId,
    });
    return verdict;
  } catch (e: any) {
    log.error("orchestrator failed", { reqId, sessionId, err: e?.message ?? String(e) });
    pushEvent(sessionId, { event: "error", data: { message: e?.message ?? String(e) } });
    pushEvent(sessionId, { event: "session_end", data: { sessionId } });
    throw e;
  }
}
