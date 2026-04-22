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

    "feed.queue": "§ Your queue",
    "feed.queue.hint": "← pass · → match · space: skip",
    "feed.candidate": "Candidate",
    "feed.of": "of",
    "feed.airanked": "AI-ranked · compatibility > complementarity > values",
    "feed.onchain": "onchain",
    "feed.lookingForLc": "looking for",
    "feed.narrative": "Narrative",
    "feed.compatibility": "Compatibility",
    "feed.whyMatch": "Why this match",
    "feed.complementarity": "Complementarity",
    "feed.lowScore": "Why the score is low",
    "feed.deployedShort": "deployed",
    "feed.commits": "commits",
    "feed.pass": "Pass",
    "feed.match": "Match",
    "feed.session": "§ This session",
    "feed.matched": "Matched",
    "feed.passed": "Passed",
    "feed.whyCandidates": "§ Why these candidates",
    "feed.whyBody":
      "Compatibility scores from onchain signal + GitHub activity + DAO votes. No Twitter. No LinkedIn. Never a stranger.",
    "feed.ranking": "§ Ranking factors",
    "feed.ranking.skill": "Skill complement",
    "feed.ranking.values": "Values alignment",
    "feed.ranking.domain": "Domain overlap",
    "feed.ranking.commit": "Commitment fit",
    "feed.ranking.rep": "Reputation synergy",
    "feed.end": "That’s everyone for now.",
    "feed.endSuffix": "new candidates daily",
    "feed.seeMutual": "See your mutual matches",

    "match.mutualCount": "§ Mutual matches",
    "match.noMutualHead": "§ No mutual matches yet",
    "match.mutualPoint": "Mutual is the whole point.",
    "match.noMutualBody":
      "When someone you swiped on swipes you back, the chat unlocks here. Until then, keep swiping.",
    "match.backToFeed": "Back to the feed",
    "match.unlocked": "§ Mutual match · unlocked",
    "match.sharedGround": "Shared ground",
    "match.chatUnlocked": "— chat unlocked —",
    "match.aiDraft": "AI draft",
    "match.useThis": "Use this",
    "match.writeTo": "Write to",
    "match.send": "Send ↵",
    "match.collabSection": "§ Collaboration",
    "match.collabNo": "collab Nº",
    "match.collabDash": "collab Nº —",
    "match.mintedHead": "Collaboration NFT minted.",
    "match.mintPrompt": "After 30 days, mint a Collaboration NFT.",
    "match.mintedCaption": "Receipt on Base Sepolia · soulbound ·",
    "match.viewTx": "view tx",
    "match.mintCaption":
      "An onchain receipt that you two worked together. Soulbound, non-transferable — appears on both profiles.",
    "match.mintCta": "Mint collaboration NFT",
    "match.minting": "Minting on-chain…",
    "match.tokenNo": "Token Nº",
    "match.loading": "Loading your matches…",

    "profile.section": "§ Onchain CV · auto-generated",
    "profile.nro": "Profile Nº",
    "profile.meta.location": "Location",
    "profile.meta.commitment": "Commitment",
    "profile.meta.lookingFor": "Looking for",
    "profile.skills": "Skills",
    "profile.domains": "Domains",
    "profile.values": "Values",
    "profile.identity": "Identity",
    "profile.narrativeHead": "— The Narrative · ai-composed from onchain signal",
    "profile.orchestrator":
      "Composed by BuilderMatch orchestrator · reasoning hash pinned to IPFS",
    "profile.stat.deployed": "Deployed",
    "profile.stat.daos": "DAOs active",
    "profile.stat.commits": "Commits",
    "profile.stat.audits": "Audits",
    "profile.receipts": "§ Receipts",
    "profile.evidence": "Evidence, not claims.",
    "profile.filter": "Filter",
    "profile.filter.all": "All",
    "profile.filter.deployed": "Deployed",
    "profile.filter.voted": "Voted",
    "profile.filter.minted": "Minted",
    "profile.table.type": "№ Type",
    "profile.table.action": "Action",
    "profile.table.venue": "Venue",
    "profile.table.date": "Date",
    "profile.table.value": "Value",
    "profile.showing": "Showing",
    "profile.receiptsSuffix": "receipts",
    "profile.viewExplorer": "view on explorer",
    "profile.indexed": "Indexed from Base Sepolia + GitHub",
    "profile.notIndexedHead": "Profile not indexed",
    "profile.notOnFile": "is not yet on file.",
    "profile.loading": "Reading onchain history…",

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

    "feed.queue": "§ 候选队列",
    "feed.queue.hint": "← 跳过 · → 匹配 · 空格:下一位",
    "feed.candidate": "候选",
    "feed.of": "/ 共",
    "feed.airanked": "AI 排序 · 互补 > 领域重叠 > 价值观",
    "feed.onchain": "链上",
    "feed.lookingForLc": "寻找",
    "feed.narrative": "叙述",
    "feed.compatibility": "匹配度",
    "feed.whyMatch": "为何匹配",
    "feed.complementarity": "互补度",
    "feed.lowScore": "为何分数低",
    "feed.deployedShort": "合约部署",
    "feed.commits": "次提交",
    "feed.pass": "跳过",
    "feed.match": "匹配",
    "feed.session": "§ 本次会话",
    "feed.matched": "已匹配",
    "feed.passed": "已跳过",
    "feed.whyCandidates": "§ 推荐依据",
    "feed.whyBody":
      "基于链上信号 + GitHub 活动 + DAO 投票计算的匹配度。不看 Twitter,不看 LinkedIn,不是陌生人。",
    "feed.ranking": "§ 排序权重",
    "feed.ranking.skill": "技能互补",
    "feed.ranking.values": "价值观契合",
    "feed.ranking.domain": "领域重叠",
    "feed.ranking.commit": "投入度匹配",
    "feed.ranking.rep": "声誉协同",
    "feed.end": "今天就到这里。",
    "feed.endSuffix": "每天更新新候选",
    "feed.seeMutual": "查看相互匹配",

    "match.mutualCount": "§ 相互匹配",
    "match.noMutualHead": "§ 暂无相互匹配",
    "match.mutualPoint": "相互匹配才是重点。",
    "match.noMutualBody":
      "当你右滑过的人也右滑了你,聊天会在这里解锁。在那之前,继续浏览。",
    "match.backToFeed": "回到推荐",
    "match.unlocked": "§ 相互匹配 · 解锁于",
    "match.sharedGround": "共同基础",
    "match.chatUnlocked": "— 聊天已解锁 —",
    "match.aiDraft": "AI 草稿",
    "match.useThis": "使用",
    "match.writeTo": "发送给",
    "match.send": "发送 ↵",
    "match.collabSection": "§ 协作",
    "match.collabNo": "协作 №",
    "match.collabDash": "协作 № —",
    "match.mintedHead": "协作 NFT 已铸造。",
    "match.mintPrompt": "协作 30 天后,铸造一个协作 NFT。",
    "match.mintedCaption": "凭证记录于 Base Sepolia · 灵魂绑定 ·",
    "match.viewTx": "查看交易",
    "match.mintCaption":
      "你们曾共同出货的链上凭证。灵魂绑定,不可转让——显示在双方档案上。",
    "match.mintCta": "铸造协作 NFT",
    "match.minting": "链上铸造中…",
    "match.tokenNo": "Token №",
    "match.loading": "正在加载你的匹配…",

    "profile.section": "§ 链上简历 · 自动生成",
    "profile.nro": "档案 №",
    "profile.meta.location": "位置",
    "profile.meta.commitment": "投入度",
    "profile.meta.lookingFor": "寻找",
    "profile.skills": "技能",
    "profile.domains": "领域",
    "profile.values": "价值观",
    "profile.identity": "身份",
    "profile.narrativeHead": "— 叙述 · AI 根据链上信号生成",
    "profile.orchestrator":
      "由 BuilderMatch 编排器生成 · 推理哈希已固定到 IPFS",
    "profile.stat.deployed": "已部署",
    "profile.stat.daos": "活跃 DAO",
    "profile.stat.commits": "提交数",
    "profile.stat.audits": "审计",
    "profile.receipts": "§ 凭证",
    "profile.evidence": "凭证,不是声明。",
    "profile.filter": "筛选",
    "profile.filter.all": "全部",
    "profile.filter.deployed": "部署",
    "profile.filter.voted": "投票",
    "profile.filter.minted": "铸造",
    "profile.table.type": "№ 类型",
    "profile.table.action": "动作",
    "profile.table.venue": "来源",
    "profile.table.date": "日期",
    "profile.table.value": "值",
    "profile.showing": "显示",
    "profile.receiptsSuffix": "条凭证",
    "profile.viewExplorer": "在浏览器查看",
    "profile.indexed": "索引自 Base Sepolia + GitHub",
    "profile.notIndexedHead": "档案未索引",
    "profile.notOnFile": "尚未建立档案。",
    "profile.loading": "正在读取链上历史…",

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
