import { AGENT_EMOJI, AGENT_IDS, AGENT_LABEL, TIER_BADGE, type Verdict } from "./types.ts";
import { config } from "./config.ts";

const TWEET_MAX = 280;
const TCO_LEN = 23; // Twitter wraps every URL to 23 chars regardless of actual length.

function tweetWeight(s: string): number {
  // Approximate Twitter's weighted character count: each http(s) URL counts as TCO_LEN chars.
  const urls = s.match(/https?:\/\/\S+/g) ?? [];
  let weight = s.length;
  for (const u of urls) weight = weight - u.length + TCO_LEN;
  return weight;
}

function ipfsToHttp(uri: string): string {
  if (!uri) return "";
  if (uri.startsWith("ipfs://")) {
    const cid = uri.slice("ipfs://".length);
    return `${config.pinata.gateway.replace(/\/$/, "")}/ipfs/${cid}`;
  }
  return uri;
}

function excerpt(reasoning: string, max = 90): string {
  const oneLine = reasoning.replace(/\s+/g, " ").trim();
  if (oneLine.length <= max) return oneLine;
  return oneLine.slice(0, max - 1).trimEnd() + "…";
}

function tokenScanUrl(tokenAddress: string): string {
  return `${config.explorerUrl.replace(/\/$/, "")}/token/${tokenAddress}`;
}

function txScanUrl(txHash: string): string {
  return `${config.explorerUrl.replace(/\/$/, "")}/tx/${txHash}`;
}

function shortAddr(addr: string): string {
  if (addr.length < 10) return addr;
  return `${addr.slice(0, 6)}…${addr.slice(-4)}`;
}

function displayName(v: Verdict): string {
  const name = v.tokenName?.trim();
  if (name) return name;
  return shortAddr(v.tokenAddress);
}

function displaySymbol(v: Verdict): string {
  const sym = v.tokenSymbol?.trim();
  return sym ? ` ($${sym})` : "";
}

function nftPermalink(v: Verdict): string {
  if (config.frontendUrl) {
    return `${config.frontendUrl.replace(/\/$/, "")}/verdict/${v.verdictNftTokenId}`;
  }
  if (config.backendUrl) {
    return `${config.backendUrl.replace(/\/$/, "")}/api/verdicts/${v.verdictNftTokenId}`;
  }
  return txScanUrl(v.txHash);
}

export function formatTweet(v: Verdict): string {
  const tier = TIER_BADGE[v.tier];
  const ipfs = ipfsToHttp(v.reasoningIpfsUri);
  const permalink = nftPermalink(v);

  const header =
    `🚨 ${displayName(v)}${displaySymbol(v)} launched on Four.meme\n\n` +
    `🤖 Guardian verdict: ${tier}\n` +
    `⚠️ Risk score: ${v.overallScore}/100\n`;

  const top = AGENT_IDS.filter((id) => v.agents[id])
    .slice(0, 3)
    .map((id) => {
      const a = v.agents[id]!;
      return `${AGENT_EMOJI[id]} ${AGENT_LABEL[id]}: ${excerpt(a.reasoning, 70)}`;
    })
    .join("\n");

  const footer = `\n\n📜 ${ipfs}\n🪪 ${permalink}`;

  let body = header + "\n" + top + footer;
  if (tweetWeight(body) <= TWEET_MAX) return body;

  const combos: Array<[number, number]> = [
    [3, 60],
    [3, 45],
    [3, 35],
    [2, 75],
    [2, 55],
    [2, 45],
    [1, 110],
    [1, 80],
  ];

  for (const [agentCount, perAgent] of combos) {
    const retop = AGENT_IDS.filter((id) => v.agents[id])
      .slice(0, agentCount)
      .map((id) => {
        const a = v.agents[id]!;
        return `${AGENT_EMOJI[id]} ${AGENT_LABEL[id]}: ${excerpt(a.reasoning, perAgent)}`;
      })
      .join("\n");
    body = header + "\n" + retop + footer;
    if (tweetWeight(body) <= TWEET_MAX) return body;
  }

  const minimal = `${header}\n${permalink}`;
  return tweetWeight(minimal) <= TWEET_MAX ? minimal : minimal.slice(0, TWEET_MAX);
}

function mdEscape(s: string): string {
  return s.replace(/[_*\[\]()~`>#+\-=|{}.!\\]/g, (c) => `\\${c}`);
}

export function formatTelegram(v: Verdict): string {
  const tier = TIER_BADGE[v.tier];
  const ipfs = ipfsToHttp(v.reasoningIpfsUri);
  const permalink = nftPermalink(v);

  const lines: string[] = [];
  const tgSym = v.tokenSymbol?.trim()
    ? ` \\($${mdEscape(v.tokenSymbol.trim())}\\)`
    : "";
  lines.push(`🚨 *${mdEscape(displayName(v))}*${tgSym} launched on Four\\.meme`);
  lines.push("");
  lines.push(`🤖 Guardian verdict: *${mdEscape(tier)}*`);
  lines.push(`⚠️ Risk score: *${v.overallScore}/100*`);
  lines.push("");

  for (const id of AGENT_IDS) {
    const a = v.agents[id];
    if (!a) continue;
    lines.push(
      `${AGENT_EMOJI[id]} *${mdEscape(AGENT_LABEL[id])}* \\(${a.score}\\): ${mdEscape(excerpt(a.reasoning, 180))}`
    );
  }

  lines.push("");
  lines.push(`📜 [Full reasoning on IPFS](${ipfs})`);
  lines.push(`🪪 [NFT certificate](${permalink})`);
  lines.push(`🔗 [Token on ${config.explorerLabel}](${tokenScanUrl(v.tokenAddress)})`);
  lines.push(`📎 [Mint tx](${txScanUrl(v.txHash)})`);

  return lines.join("\n");
}

export function verdictKey(v: Verdict): string {
  return `${v.chainId}:${v.verdictNftTokenId}`;
}
