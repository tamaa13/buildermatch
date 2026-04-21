import { config } from "../config";
import { log } from "../util/log";

async function bscscan(params: Record<string, string>): Promise<any> {
  const qs = new URLSearchParams({ ...params, apikey: config.bscscanApiKey });
  const url = `${config.bscscanBase}?${qs.toString()}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`bscscan ${res.status}`);
  const body = (await res.json()) as { status: string; message: string; result: any };
  return body.result;
}

export async function getSourceCode(address: string): Promise<{
  sourceCode: string;
  contractName: string;
  compilerVersion: string;
  isVerified: boolean;
} | null> {
  try {
    const result = await bscscan({ module: "contract", action: "getsourcecode", address });
    const first = Array.isArray(result) ? result[0] : null;
    if (!first) return null;
    const sourceCode = String(first.SourceCode ?? "");
    return {
      sourceCode,
      contractName: String(first.ContractName ?? ""),
      compilerVersion: String(first.CompilerVersion ?? ""),
      isVerified: sourceCode.length > 0,
    };
  } catch (e) {
    log.warn("bscscan.getSourceCode failed", { address, err: String(e) });
    return null;
  }
}

export async function getTxList(address: string, limit = 50): Promise<
  Array<{ hash: string; from: string; to: string; value: string; timeStamp: string; blockNumber: string }>
> {
  try {
    const result = await bscscan({
      module: "account",
      action: "txlist",
      address,
      startblock: "0",
      endblock: "99999999",
      page: "1",
      offset: String(limit),
      sort: "asc",
    });
    if (!Array.isArray(result)) return [];
    return result;
  } catch (e) {
    log.warn("bscscan.getTxList failed", { address, err: String(e) });
    return [];
  }
}

export async function getCreatorAndCreationTx(address: string): Promise<{
  contractCreator: `0x${string}` | null;
  txHash: string | null;
}> {
  try {
    const result = await bscscan({
      module: "contract",
      action: "getcontractcreation",
      contractaddresses: address,
    });
    const first = Array.isArray(result) ? result[0] : null;
    if (!first) return { contractCreator: null, txHash: null };
    return {
      contractCreator: (first.contractCreator ?? null) as `0x${string}` | null,
      txHash: first.txHash ?? null,
    };
  } catch (e) {
    log.warn("bscscan.getCreator failed", { address, err: String(e) });
    return { contractCreator: null, txHash: null };
  }
}

// Summarize tx history for dev-stalker.
export function summarizeDevActivity(
  txs: Array<{ from: string; to: string; timeStamp: string }>,
  devAddress: string,
) {
  if (!txs.length) {
    return { firstTxTimestamp: null as number | null, txCount: 0, fundedBy: null as string | null };
  }
  const sorted = [...txs].sort((a, b) => Number(a.timeStamp) - Number(b.timeStamp));
  const firstTx = sorted[0];
  // First incoming tx is usually the funding source.
  const firstIncoming = sorted.find(
    (t) => t.to?.toLowerCase() === devAddress.toLowerCase() && t.from?.toLowerCase() !== devAddress.toLowerCase(),
  );
  return {
    firstTxTimestamp: firstTx ? Number(firstTx.timeStamp) : null,
    txCount: txs.length,
    fundedBy: firstIncoming?.from ?? null,
  };
}
