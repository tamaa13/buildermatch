import { config, hasPinataCreds } from "./config.ts";

const PINATA_BASE = "https://api.pinata.cloud";

export interface PinResult {
  cid: string;
  uri: string;
  gateway: string;
  size: number;
  pinnedAt: string;
}

function gatewayUrl(cid: string): string {
  return `${config.pinata.gateway.replace(/\/$/, "")}/ipfs/${cid}`;
}

async function pinataFetch(path: string, init: RequestInit): Promise<Response> {
  if (!hasPinataCreds()) {
    throw new Error("PINATA_JWT missing — cannot pin to IPFS");
  }
  const res = await fetch(`${PINATA_BASE}${path}`, {
    ...init,
    headers: {
      ...(init.headers ?? {}),
      Authorization: `Bearer ${config.pinata.jwt}`,
    },
  });
  if (!res.ok) {
    const body = await res.text();
    throw new Error(`Pinata ${path} ${res.status}: ${body}`);
  }
  return res;
}

export async function pinJson(
  payload: unknown,
  opts: { name?: string; keyvalues?: Record<string, string> } = {}
): Promise<PinResult> {
  const res = await pinataFetch("/pinning/pinJSONToIPFS", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      pinataContent: payload,
      pinataMetadata: {
        name: opts.name ?? "memegard-verdict",
        keyvalues: opts.keyvalues ?? {},
      },
    }),
  });
  const json = (await res.json()) as { IpfsHash: string; PinSize: number; Timestamp: string };
  return {
    cid: json.IpfsHash,
    uri: `ipfs://${json.IpfsHash}`,
    gateway: gatewayUrl(json.IpfsHash),
    size: json.PinSize,
    pinnedAt: json.Timestamp,
  };
}

export async function pinFile(
  file: Blob,
  filename: string,
  opts: { name?: string; keyvalues?: Record<string, string> } = {}
): Promise<PinResult> {
  const form = new FormData();
  form.append("file", file, filename);
  form.append(
    "pinataMetadata",
    JSON.stringify({
      name: opts.name ?? filename,
      keyvalues: opts.keyvalues ?? {},
    })
  );
  const res = await pinataFetch("/pinning/pinFileToIPFS", {
    method: "POST",
    body: form,
  });
  const json = (await res.json()) as { IpfsHash: string; PinSize: number; Timestamp: string };
  return {
    cid: json.IpfsHash,
    uri: `ipfs://${json.IpfsHash}`,
    gateway: gatewayUrl(json.IpfsHash),
    size: json.PinSize,
    pinnedAt: json.Timestamp,
  };
}

export async function pinFileFromPath(
  path: string,
  opts: { name?: string; keyvalues?: Record<string, string> } = {}
): Promise<PinResult> {
  const file = Bun.file(path);
  if (!(await file.exists())) throw new Error(`File not found: ${path}`);
  const blob = new Blob([await file.arrayBuffer()], {
    type: file.type || "application/octet-stream",
  });
  const filename = path.split("/").pop() ?? "upload.bin";
  return pinFile(blob, filename, opts);
}

async function runCli() {
  const args = process.argv.slice(2);
  if (args.length === 0) {
    console.error(
      [
        "Usage:",
        "  bun src/ipfs-pin.ts --json '<payload>' [--name <name>]",
        "  bun src/ipfs-pin.ts --file <path>      [--name <name>]",
        "  bun src/ipfs-pin.ts --stdin            [--name <name>]",
      ].join("\n")
    );
    process.exit(1);
  }

  let mode: "json" | "file" | "stdin" | null = null;
  let value = "";
  let name: string | undefined;

  for (let i = 0; i < args.length; i++) {
    const a = args[i]!;
    if (a === "--json") {
      mode = "json";
      value = args[++i] ?? "";
    } else if (a === "--file") {
      mode = "file";
      value = args[++i] ?? "";
    } else if (a === "--stdin") {
      mode = "stdin";
    } else if (a === "--name") {
      name = args[++i];
    }
  }

  try {
    let result: PinResult;
    if (mode === "json") {
      result = await pinJson(JSON.parse(value), { name });
    } else if (mode === "file") {
      result = await pinFileFromPath(value, { name });
    } else if (mode === "stdin") {
      const chunks: Uint8Array[] = [];
      for await (const chunk of Bun.stdin.stream()) chunks.push(chunk);
      const blob = new Blob(chunks);
      const text = await blob.text();
      result = await pinJson(JSON.parse(text), { name });
    } else {
      console.error("Must pass --json, --file, or --stdin");
      process.exit(1);
    }
    console.log(JSON.stringify(result, null, 2));
  } catch (err) {
    console.error("pin failed:", (err as Error).message);
    process.exit(1);
  }
}

if (import.meta.main) {
  void runCli();
}
