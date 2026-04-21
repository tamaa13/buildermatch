import { config } from "../config";

const levels = { debug: 10, info: 20, warn: 30, error: 40 } as const;
type Level = keyof typeof levels;

const current = (levels as Record<string, number>)[config.logLevel] ?? levels.info;

function fmt(level: Level, msg: string, meta?: Record<string, unknown>) {
  const stamp = new Date().toISOString();
  if (meta) return `${stamp} ${level.toUpperCase()} ${msg} ${JSON.stringify(meta)}`;
  return `${stamp} ${level.toUpperCase()} ${msg}`;
}

export const log = {
  debug(msg: string, meta?: Record<string, unknown>) {
    if (levels.debug < current) return;
    console.log(fmt("debug", msg, meta));
  },
  info(msg: string, meta?: Record<string, unknown>) {
    if (levels.info < current) return;
    console.log(fmt("info", msg, meta));
  },
  warn(msg: string, meta?: Record<string, unknown>) {
    if (levels.warn < current) return;
    console.warn(fmt("warn", msg, meta));
  },
  error(msg: string, meta?: Record<string, unknown>) {
    console.error(fmt("error", msg, meta));
  },
};
