"use client";

import { useEffect, useSyncExternalStore } from "react";

// Minimal i18n — static dictionary for en + zh-CN, hook + global toggle.
// Translations cover the top-of-funnel strings a judge reads in the first
// 10 seconds (nav, hero, stats, primary CTAs). Deeper surface area (LLM
// rationales, chat, receipts) stays in English because the content itself
// is dynamic or technical.

export type Lang = "en" | "zh";

const dict: Record<Lang, Record<string, string>> = {
  en: {
    "nav.home": "Home",
    "nav.profile": "My CV",
    "nav.feed": "Feed",
    "nav.matches": "Matches",

    "masthead.edition": "Vol. 04 · No. 17 · April 2026",
    "masthead.cities": "Lisbon · New York · Tokyo",
    "masthead.tagline": "An honest directory of builders",

    "hero.eyebrow": "— A co-founder directory, verified onchain",
    "hero.h1.line1": "Find the one",
    "hero.h1.line2": "who will build",
    "hero.h1.line3": "the next thing",
    "hero.h1.line4": "with you.",
    "hero.sub":
      "LinkedIn has résumés. Twitter has noise. We have receipts — contracts you deployed, DAOs you voted in, code you shipped. Connect a wallet, and your profile writes itself.",

    "step.one": "Step one",
    "step.two": "Step two",
    "step.connect": "Connect a wallet to see your profile.",
    "step.github": "Link your GitHub — or skip to sync from onchain only.",
    "btn.connect": "Connect wallet",
    "btn.connectGithub": "Connect GitHub",
    "btn.syncProfile": "Sync profile",
    "btn.openingWallet": "Opening MetaMask…",
    "btn.readingChain": "Reading onchain history…",
    "btn.disconnect": "Disconnect",
    "btn.verified": "✓ Verified",
    "btn.findMatch": "Find my match",
    "btn.shareCV": "Share my CV",
    "btn.linkCopied": "Link copied",
    "btn.browseGuest": "Browse the feed as a guest",
    "btn.sampleProfile": "See a sample profile",

    "note.readonly":
      "Read-only signature. We never touch funds. Profiles are public by default.",

    "stats.profiles": "Profiles built",
    "stats.profilesSuffix": "from onchain activity",
    "stats.matches": "Mutual matches",
    "stats.matchesSuffix": "since launch",
    "stats.attestations": "Collaboration NFTs",
    "stats.attestationsSuffix": "minted on Base Sepolia",

    "method.heading": "§ 01 — Method",
    "method.tagline1": "Three steps, no pitching.",
    "method.tagline2": "The data is already there.",

    "manifesto.heading": "§ 02 — A note from the editors",
    "manifesto.body":
      'We built this because we\'re tired of a signup flow where the first question is "tell us about yourself". You already did. Four years of it. It\'s public. Let us just read it.',

    "footer.copy": "© BuilderMatch Press · Verified on Base Sepolia",
    "footer.sourceAvailable": "Source-available",

    "lang.toggle": "中文",
  },
  zh: {
    "nav.home": "首页",
    "nav.profile": "我的简历",
    "nav.feed": "推荐",
    "nav.matches": "匹配",

    "masthead.edition": "第04卷 · 第17期 · 2026年4月",
    "masthead.cities": "里斯本 · 纽约 · 东京",
    "masthead.tagline": "真实的建设者名录",

    "hero.eyebrow": "— 链上验证的联合创始人名录",
    "hero.h1.line1": "找到那个",
    "hero.h1.line2": "愿与你一起",
    "hero.h1.line3": "打造下一个",
    "hero.h1.line4": "产品的人。",
    "hero.sub":
      "LinkedIn 全是简历。Twitter 充斥噪音。我们只看凭证——你部署的合约、你投过的DAO票、你提交的代码。连接钱包,你的档案自动生成。",

    "step.one": "第一步",
    "step.two": "第二步",
    "step.connect": "连接钱包查看档案。",
    "step.github": "绑定 GitHub——或直接用链上数据生成。",
    "btn.connect": "连接钱包",
    "btn.connectGithub": "连接 GitHub",
    "btn.syncProfile": "生成档案",
    "btn.openingWallet": "正在打开 MetaMask…",
    "btn.readingChain": "读取链上历史…",
    "btn.disconnect": "断开",
    "btn.verified": "✓ 已验证",
    "btn.findMatch": "匹配共创者",
    "btn.shareCV": "分享我的档案",
    "btn.linkCopied": "已复制",
    "btn.browseGuest": "以访客身份浏览",
    "btn.sampleProfile": "查看示例档案",

    "note.readonly":
      "只读签名,不触碰资金。档案默认公开。",

    "stats.profiles": "已生成档案",
    "stats.profilesSuffix": "来自链上活动",
    "stats.matches": "成功匹配",
    "stats.matchesSuffix": "自上线以来",
    "stats.attestations": "协作 NFT",
    "stats.attestationsSuffix": "铸造于 Base Sepolia",

    "method.heading": "§ 01 — 方法",
    "method.tagline1": "三步完成,无需自我推销。",
    "method.tagline2": "数据早已存在。",

    "manifesto.heading": "§ 02 — 编辑的话",
    "manifesto.body":
      "我们造这个,因为厌倦了注册第一个问题就是\"介绍一下自己\"。你已经在链上介绍了四年。公开可查。我们只是读一读而已。",

    "footer.copy": "© BuilderMatch Press · Base Sepolia 链上验证",
    "footer.sourceAvailable": "开源",

    "lang.toggle": "EN",
  },
};

// Subscribe-style store so any component using `useT` re-renders when the
// language flips. localStorage is read once during client boot; SSR renders
// in English (fine — it hydrates to the user's preference on mount).
const LANG_KEY = "buildermatch.lang";
let currentLang: Lang = "en";
const listeners = new Set<() => void>();

function loadInitial(): Lang {
  if (typeof window === "undefined") return "en";
  const stored = window.localStorage.getItem(LANG_KEY);
  return stored === "zh" ? "zh" : "en";
}

export function setLang(lang: Lang) {
  currentLang = lang;
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LANG_KEY, lang);
    document.documentElement.lang = lang === "zh" ? "zh-CN" : "en";
  }
  for (const l of listeners) l();
}

function subscribe(cb: () => void) {
  listeners.add(cb);
  return () => {
    listeners.delete(cb);
  };
}

function getSnapshot(): Lang {
  return currentLang;
}

function getServerSnapshot(): Lang {
  return "en";
}

export function useLang(): Lang {
  const lang = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);
  useEffect(() => {
    const initial = loadInitial();
    if (initial !== currentLang) setLang(initial);
  }, []);
  return lang;
}

export function useT(): (key: string) => string {
  const lang = useLang();
  return (key: string) => dict[lang][key] ?? dict.en[key] ?? key;
}
