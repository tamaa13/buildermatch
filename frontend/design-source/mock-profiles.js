// Mock builder profiles — seeded, realistic-feeling onchain CVs
window.BUILDERS = [
  {
    id: "you",
    ens: "paloma.eth",
    address: "0x8a3C...F29b",
    role: "Senior DeFi Builder",
    tenure: "3yr",
    avatar: "PL",
    location: "Lisbon",
    timezone: "UTC+0",
    commitment: "Full-time",
    lookingFor: "Technical co-founder",
    skills: ["Solidity", "Vyper", "zkSync", "Foundry", "Mechanism Design"],
    domains: ["DeFi", "Infrastructure", "MEV"],
    narrative: "Paloma has shipped three production DeFi protocols, one of which — a dutch-auction liquidation engine — is still used by two major lending platforms. She is unusually comfortable in the intersection of cryptography and game theory, and prefers building quiet infrastructure over chasing narratives. Writes dense but readable Solidity; argues for simplicity in every review.",
    stats: { deployed: 14, daos: 6, commits: 2847, audits: 3 },
    receipts: [
      { type: "Deployed", name: "LiquidationEngineV2.sol", venue: "Ethereum Mainnet", date: "Mar 2026", value: "18.2M TVL" },
      { type: "Authored", name: "EIP-7702 implementation notes", venue: "Ethereum Magicians", date: "Jan 2026", value: "142 replies" },
      { type: "Voted", name: "24 proposals", venue: "Optimism · Arbitrum · ENS", date: "2025", value: "91% turnout" },
      { type: "Audited", name: "Morpho Blue integration", venue: "Spearbit", date: "Nov 2025", value: "3 findings" }
    ]
  },
  {
    id: "b1",
    ens: "yuki.eth",
    address: "0x4F21...A7D3",
    role: "Product Designer · Onchain",
    tenure: "4yr",
    avatar: "YK",
    location: "Tokyo",
    timezone: "UTC+9",
    commitment: "Full-time",
    lookingFor: "Technical co-founder",
    skills: ["Interaction Design", "Brand", "Figma", "SwiftUI", "Design Systems"],
    domains: ["Consumer", "Wallets", "Social"],
    narrative: "Yuki designed the original wallet UX for two consumer-crypto products that together onboarded 1.2M non-native users. Her work is quiet, opinionated, and unusually attentive to the seams where crypto meets the rest of the internet. She is looking for an engineer who takes typography seriously.",
    stats: { deployed: 2, daos: 3, commits: 412, shipped: 11 },
    compatibility: 94,
    whyMatch: "You've been shipping protocols alone; Yuki has been shipping interfaces alone. Her attention to onboarding seams would complement your preference for quiet infrastructure — and she has governance experience in two of the DAOs you're active in.",
    complementarity: [
      { left: "Your Solidity", right: "Her Interaction", score: 96 },
      { left: "Your DeFi depth", right: "Her Consumer reach", score: 91 },
      { left: "Your Timezone", right: "Hers", score: 52 }
    ],
    receipts: [
      { type: "Shipped", name: "Rainbow Wallet redesign", venue: "Rainbow", date: "2024", value: "1.2M users" },
      { type: "Voted", name: "48 proposals", venue: "ENS · Gitcoin", date: "2025", value: "88% turnout" },
      { type: "Authored", name: "'Onboarding as a first-class surface'", venue: "Are.na", date: "Feb 2026", value: "3k reads" }
    ]
  },
  {
    id: "b2",
    ens: "remi.eth",
    address: "0xC18A...5E42",
    role: "Infrastructure Engineer",
    tenure: "6yr",
    avatar: "RM",
    location: "Berlin",
    timezone: "UTC+1",
    commitment: "Full-time",
    lookingFor: "Design co-founder",
    skills: ["Rust", "Go", "libp2p", "Geth", "Reth"],
    domains: ["Infrastructure", "L2s", "Rollups"],
    narrative: "Rémi has been writing Ethereum execution clients for longer than most people have been in crypto. He spent two years on Reth and is now independent, prototyping a minimal sequencer. Prefers deep work, long nights, and collaborators who write their own tests.",
    stats: { deployed: 8, daos: 2, commits: 9241, clients: 2 },
    compatibility: 82,
    whyMatch: "Rémi goes deeper than you on execution-layer work — a strong complement if you want to own the protocol side while he owns the node. You both prefer infrastructure over narratives.",
    complementarity: [
      { left: "Your Solidity", right: "His Rust", score: 88 },
      { left: "Your Game theory", right: "His Systems", score: 79 },
      { left: "Your Timezone", right: "His", score: 94 }
    ],
    receipts: [
      { type: "Contributed", name: "Reth — 341 merged PRs", venue: "paradigm-xyz/reth", date: "2023–25", value: "Core dev" },
      { type: "Deployed", name: "Minimal sequencer prototype", venue: "Base testnet", date: "Feb 2026", value: "—" }
    ]
  },
  {
    id: "b3",
    ens: "ines.eth",
    address: "0x9D07...B1F8",
    role: "Mechanism Designer · Economist",
    tenure: "2yr",
    avatar: "IN",
    location: "Buenos Aires",
    timezone: "UTC-3",
    commitment: "Full-time",
    lookingFor: "Technical co-founder",
    skills: ["Mechanism Design", "Auctions", "Python", "Research", "Writing"],
    domains: ["DeFi", "Governance", "Prediction Markets"],
    narrative: "Inés came to crypto from academic microeconomics and has published well-regarded work on MEV auctions and credible-neutral orderflow. She is looking for a builder to translate her theoretical work into production code — ideally someone with real Solidity depth.",
    stats: { deployed: 1, daos: 4, commits: 203, papers: 6 },
    compatibility: 89,
    whyMatch: "Inés publishes the mechanism-design papers you quote. She has theory; you have production Solidity. This is a classic theory-meets-implementation pairing, and you're already active in two of the same research Discords.",
    complementarity: [
      { left: "Your Solidity", right: "Her Research", score: 96 },
      { left: "Your Mechanism Design", right: "Hers", score: 81 },
      { left: "Your Timezone", right: "Hers", score: 48 }
    ],
    receipts: [
      { type: "Published", name: "'Credibly neutral orderflow auctions'", venue: "SSRN", date: "Oct 2025", value: "411 citations" },
      { type: "Deployed", name: "AuctionSim.sol", venue: "Sepolia", date: "Aug 2025", value: "Research" }
    ]
  },
  {
    id: "b4",
    ens: "keahi.eth",
    address: "0x1A5F...32C9",
    role: "Full-stack · Frontend",
    tenure: "3yr",
    avatar: "KE",
    location: "Honolulu",
    timezone: "UTC-10",
    commitment: "Part-time",
    lookingFor: "Technical co-founder",
    skills: ["React", "TypeScript", "viem", "wagmi", "Three.js"],
    domains: ["Consumer", "NFT", "Social"],
    narrative: "Keahi built two NFT frontends that are still running and cited as reference implementations. She's pragmatic about wagmi, opinionated about accessibility, and has a side practice in generative art that occasionally pays better than contract work.",
    stats: { deployed: 0, daos: 2, commits: 1847, shipped: 9 },
    compatibility: 71,
    whyMatch: "Keahi is a strong frontend counterpart, but timezone gap is real and she's only part-time available. Worth a conversation if async works for you.",
    complementarity: [
      { left: "Your Solidity", right: "Her Frontend", score: 91 },
      { left: "Your Availability", right: "Hers", score: 42 }
    ],
    receipts: [
      { type: "Shipped", name: "Zora mint frontend ref", venue: "ourzora/zora-mint", date: "2024", value: "2.3k stars" }
    ]
  },
  {
    id: "b5",
    ens: "sam.eth",
    address: "0x7E90...A184",
    role: "Smart Contract Auditor",
    tenure: "5yr",
    avatar: "SM",
    location: "New York",
    timezone: "UTC-5",
    commitment: "Full-time",
    lookingFor: "Technical co-founder",
    skills: ["Solidity", "Halmos", "Foundry", "Formal Verification", "Huff"],
    domains: ["Security", "DeFi", "Infrastructure"],
    narrative: "Sam has audited over 90 contracts across three firms and is considered one of the tighter reviewers on the invariant-testing side. He is restless — wants to build rather than review — and is unusually good at translating audit intuitions back into protocol design.",
    stats: { deployed: 3, daos: 1, commits: 891, audits: 94 },
    compatibility: 86,
    whyMatch: "Sam has reviewed two contracts you've deployed and left useful comments on both. You'd get deep security intuition from day one; he'd get protocol ownership.",
    complementarity: [
      { left: "Your Protocol", right: "His Security", score: 97 },
      { left: "Your DeFi", right: "His DeFi", score: 89 }
    ],
    receipts: [
      { type: "Audited", name: "94 engagements", venue: "Spearbit · Cantina · solo", date: "2021–26", value: "41 critical" }
    ]
  },
  {
    id: "b6",
    ens: "mira.eth",
    address: "0x3B4C...E77F",
    role: "ZK Research Engineer",
    tenure: "3yr",
    avatar: "MR",
    location: "Zurich",
    timezone: "UTC+1",
    commitment: "Full-time",
    lookingFor: "Business co-founder",
    skills: ["Circom", "Halo2", "Rust", "Cryptography", "Noir"],
    domains: ["ZK", "Privacy", "Infrastructure"],
    narrative: "Mira moved from a cryptography PhD to full-time ZK engineering two years ago. She is currently between two projects and specifically looking for someone non-technical to handle fundraising and partnerships so she can keep shipping circuits.",
    stats: { deployed: 4, daos: 1, commits: 612, papers: 3 },
    compatibility: 64,
    whyMatch: "Mira is a strong builder but she's looking for a non-technical co-founder — a poor fit for your profile. Pass unless you want to introduce her to someone.",
    complementarity: [
      { left: "Your Solidity", right: "Her Circom", score: 74 },
      { left: "Your Role-fit", right: "What she wants", score: 31 }
    ],
    receipts: [
      { type: "Deployed", name: "PrivatePool Circom circuits", venue: "Mainnet", date: "Jan 2026", value: "820 users" }
    ]
  },
  {
    id: "b7",
    ens: "toma.eth",
    address: "0xE2D8...4C01",
    role: "Growth · Community",
    tenure: "4yr",
    avatar: "TM",
    location: "London",
    timezone: "UTC+0",
    commitment: "Full-time",
    lookingFor: "Technical co-founder",
    skills: ["Growth", "DAO Ops", "Writing", "Dune", "Community"],
    domains: ["Governance", "Consumer", "DAOs"],
    narrative: "Toma has led growth at two DAOs and grew a third from 200 to 14k active members in 11 months. Writes a weekly letter with 18k subscribers. Explicitly looking for a deep technical partner so they can stop moonlighting on contract work.",
    stats: { deployed: 0, daos: 7, commits: 88, subs: 18000 },
    compatibility: 78,
    whyMatch: "Toma's weekly letter already cites two of your deployments. Strong growth counterpart if you want someone to own distribution and governance while you own the stack.",
    complementarity: [
      { left: "Your Engineering", right: "Their Growth", score: 94 },
      { left: "Your Timezone", right: "Theirs", score: 100 },
      { left: "Your Network overlap", right: "Theirs", score: 81 }
    ],
    receipts: [
      { type: "Grew", name: "Nouns Climate DAO", venue: "Discord · Farcaster", date: "2024–25", value: "200→14k" }
    ]
  },
  {
    id: "b8",
    ens: "juno.eth",
    address: "0x5F2A...8B19",
    role: "Protocol Engineer",
    tenure: "2yr",
    avatar: "JN",
    location: "Seoul",
    timezone: "UTC+9",
    commitment: "Full-time",
    lookingFor: "Technical co-founder",
    skills: ["Solidity", "Move", "Sui", "Rust", "Cairo"],
    domains: ["L2s", "Infrastructure", "DeFi"],
    narrative: "Juno is one of the few engineers equally fluent in EVM and Move. Shipped two production bridges, one of which has not had a security incident in 14 months — a meaningful claim in this category.",
    stats: { deployed: 6, daos: 2, commits: 3201 },
    compatibility: 81,
    receipts: [
      { type: "Deployed", name: "Bridge v2 — Sui ↔ Ethereum", venue: "Mainnet", date: "Dec 2024", value: "41M TVL" }
    ]
  },
  {
    id: "b9",
    ens: "aziz.eth",
    address: "0xB0D1...76F3",
    role: "Founder · Former DeFi PM",
    tenure: "5yr",
    avatar: "AZ",
    location: "Dubai",
    timezone: "UTC+4",
    commitment: "Full-time",
    lookingFor: "Technical co-founder",
    skills: ["Product", "Fundraising", "Tokenomics", "BD", "Writing"],
    domains: ["DeFi", "RWA", "Infrastructure"],
    narrative: "Aziz was PM on two top-20 DeFi protocols before leaving to start something new. Has raised a seed round once before, knows the mechanics. Currently pre-idea, pre-team, specifically looking for a deep technical partner to shape direction together.",
    stats: { deployed: 2, daos: 3, commits: 140, raised: "2.1M" },
    compatibility: 73,
    receipts: [
      { type: "Raised", name: "Seed round — undisclosed protocol", venue: "Paradigm · Variant", date: "2023", value: "$2.1M" }
    ]
  },
  {
    id: "b10",
    ens: "nika.eth",
    address: "0x6C33...D2A0",
    role: "Solidity Engineer",
    tenure: "3yr",
    avatar: "NK",
    location: "Tbilisi",
    timezone: "UTC+4",
    commitment: "Full-time",
    lookingFor: "Design co-founder",
    skills: ["Solidity", "Foundry", "Yul", "MEV", "Flashbots"],
    domains: ["MEV", "DeFi", "Trading"],
    narrative: "Nika works on MEV infrastructure and has quietly shipped three searcher systems. Writes the kind of Yul you only write after months of gas-golfing. Prefers a design partner who can translate complicated mechanism output into something a human would actually use.",
    stats: { deployed: 5, daos: 1, commits: 1420 },
    compatibility: 76,
    receipts: [
      { type: "Deployed", name: "Searcher v3", venue: "Flashbots relay", date: "Oct 2025", value: "Private" }
    ]
  },
  {
    id: "b11",
    ens: "lou.eth",
    address: "0xA441...39BC",
    role: "Generative Artist · Dev",
    tenure: "6yr",
    avatar: "LO",
    location: "Paris",
    timezone: "UTC+1",
    commitment: "Part-time",
    lookingFor: "Collaborator",
    skills: ["Three.js", "GLSL", "p5.js", "Solidity", "Art"],
    domains: ["Art", "NFT", "Consumer"],
    narrative: "Lou has sold work through Art Blocks and fxhash and has a quiet following among collectors. Technical enough to deploy their own contracts. Part-time available; more interested in long creative collaborations than startups.",
    stats: { deployed: 11, daos: 0, commits: 520, editions: 7 },
    compatibility: 58,
    receipts: [
      { type: "Released", name: "'Quiet Meridians' — 300 editions", venue: "Art Blocks", date: "Sep 2025", value: "Sold out" }
    ]
  }
];

window.CHAT_SEED = [
  { who: "them", at: "10:42", text: "Just saw we matched — your liquidation engine post from March is what got me into mechanism design properly." },
  { who: "you", at: "10:51", text: "Thanks. I read your orderflow auction paper twice last weekend. The section on budget-balanced rebates is the cleanest framing I've seen." },
  { who: "them", at: "10:54", text: "Appreciate that. Most people skip it." }
];
