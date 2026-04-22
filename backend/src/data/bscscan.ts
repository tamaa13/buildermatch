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

export interface ExplorerTx {
  hash: string;
  from: string;
  to: string;
  value: string;
  timeStamp: string;
  blockNumber: string;
  contractAddress?: string; // non-empty on contract-creation txs
  functionName?: string;
  isError?: string;
}

export async function getTxList(address: string, limit = 50): Promise<ExplorerTx[]> {
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

// Extract contract-creation txs from a tx list — indexed API doesn't have
// "contracts deployed by X", but txlist marks creations with a non-empty
// contractAddress.
export function filterDeployedContracts(txs: ExplorerTx[], chainId: number) {
  return txs
    .filter((t) => t.contractAddress && t.contractAddress.length > 0 && t.isError !== "1")
    .map((t) => ({
      chainId,
      address: t.contractAddress!,
      txHash: t.hash,
      when: Number(t.timeStamp),
      note: "deployed contract",
    }));
}

export interface WalletSummary {
  firstTxTimestamp: number | null;
  txCount: number;
  fundedBy: string | null;
}

export function summarizeWallet(txs: ExplorerTx[], owner: string): WalletSummary {
  if (!txs.length) return { firstTxTimestamp: null, txCount: 0, fundedBy: null };
  const sorted = [...txs].sort((a, b) => Number(a.timeStamp) - Number(b.timeStamp));
  const firstIncoming = sorted.find(
    (t) => t.to?.toLowerCase() === owner.toLowerCase() && t.from?.toLowerCase() !== owner.toLowerCase(),
  );
  return {
    firstTxTimestamp: Number(sorted[0].timeStamp),
    txCount: txs.length,
    fundedBy: firstIncoming?.from ?? null,
  };
}

export interface NftTransfer {
  chainId: number;
  contract: string;
  tokenId: string;
  from: string;
  to: string;
  when: number;
  txHash: string;
}

// Fetch ERC-721 transfers where `address` is either sender or receiver.
// Blockscout + Etherscan-compat APIs expose this as `module=account,
// action=tokennfttx`. Used to surface collaboration NFTs (and any other
// ERC-721s) as receipts on a builder's profile.
export async function getNftTransfers(
  address: string,
  chainId: number,
  limit = 50,
): Promise<NftTransfer[]> {
  try {
    const result = await bscscan({
      module: "account",
      action: "tokennfttx",
      address,
      startblock: "0",
      endblock: "99999999",
      page: "1",
      offset: String(limit),
      sort: "desc",
    });
    if (!Array.isArray(result)) return [];
    return result.map((t: Record<string, string>) => ({
      chainId,
      contract: t.contractAddress ?? "",
      tokenId: t.tokenID ?? "",
      from: t.from ?? "",
      to: t.to ?? "",
      when: Number(t.timeStamp ?? 0),
      txHash: t.hash ?? "",
    }));
  } catch (e) {
    log.warn("bscscan.getNftTransfers failed", { address, err: String(e) });
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

