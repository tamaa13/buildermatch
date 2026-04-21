import { TwitterApi } from "twitter-api-v2";
import { config, hasTwitterCreds } from "./config.ts";
import { formatTweet } from "./format.ts";
import type { Verdict } from "./types.ts";

let client: TwitterApi | null = null;

function getClient(): TwitterApi {
  if (client) return client;
  if (!hasTwitterCreds()) throw new Error("Twitter creds missing");
  client = new TwitterApi({
    appKey: config.twitter.consumerKey,
    appSecret: config.twitter.consumerSecret,
    accessToken: config.twitter.accessToken,
    accessSecret: config.twitter.accessSecret,
  });
  return client;
}

export interface TweetResult {
  id: string;
  url: string;
  text: string;
  dryRun: boolean;
}

export async function publishVerdict(v: Verdict): Promise<TweetResult> {
  const text = formatTweet(v);

  if (config.dryRun || !hasTwitterCreds()) {
    console.log("[twitter dry-run]\n" + text + "\n");
    return { id: "dry-run", url: "", text, dryRun: true };
  }

  const { data } = await getClient().v2.tweet(text);
  const url = `https://twitter.com/i/web/status/${data.id}`;
  console.log(`[twitter] posted ${url}`);
  return { id: data.id, url, text, dryRun: false };
}

async function runCli() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: bun src/twitter-bot.ts <verdict.json>");
    process.exit(1);
  }
  const raw = await Bun.file(path).text();
  const v = JSON.parse(raw) as Verdict;
  const res = await publishVerdict(v);
  console.log(JSON.stringify(res, null, 2));
}

if (import.meta.main) {
  void runCli();
}
