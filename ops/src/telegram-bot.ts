import { Bot } from "grammy";
import { config, hasTelegramCreds } from "./config.ts";
import { formatTelegram } from "./format.ts";
import { extractVerdicts, type Verdict } from "./types.ts";

let bot: Bot | null = null;

function getBot(): Bot {
  if (bot) return bot;
  if (!hasTelegramCreds()) throw new Error("Telegram creds missing");
  bot = new Bot(config.telegram.botToken);
  return bot;
}

export interface TgResult {
  messageId: number | null;
  text: string;
  dryRun: boolean;
}

export async function publishVerdict(v: Verdict): Promise<TgResult> {
  const text = formatTelegram(v);

  if (config.dryRun || !hasTelegramCreds()) {
    console.log("[telegram dry-run]\n" + text + "\n");
    return { messageId: null, text, dryRun: true };
  }

  const msg = await getBot().api.sendMessage(config.telegram.chatId, text, {
    parse_mode: "MarkdownV2",
    link_preview_options: { is_disabled: false },
  });
  console.log(`[telegram] posted message ${msg.message_id}`);
  return { messageId: msg.message_id, text, dryRun: false };
}

async function runCli() {
  const path = process.argv[2];
  if (!path) {
    console.error("Usage: bun src/telegram-bot.ts <verdict.json>");
    process.exit(1);
  }
  const raw = await Bun.file(path).text();
  const verdicts = extractVerdicts(JSON.parse(raw));
  for (const v of verdicts) {
    const res = await publishVerdict(v);
    console.log(JSON.stringify(res, null, 2));
  }
}

if (import.meta.main) {
  void runCli();
}
