# memegard —— Four.meme 的守护者 Guardian

> **Four.meme 每天上线约 1000 个代币,其中 95% 是 rug。**
> memegard 是一个多智能体 AI 群,在你 ape 之前就审讯每一个新代币、激辩其风险,并把判决永久写入链上。

[English README](./README.md) · [演示视频](./ops/demo.mp4) · [路演 PPT](./ops/pitch/pitch.pdf) · [Twitter 机器人](#社交发布器) · [Telegram 机器人](#社交发布器)

---

## 产品做什么

把一个 Four.meme 代币合约地址丢进来。**五个** Claude 驱动的专家 AI 智能体会实时拉取链上 + 社交数据、互相辩论、最终达成风险判决。编排器把完整辩论记录 pin 到 IPFS,并在 **Base Sepolia 测试网**(chainId `84532`)上 mint 一张 ERC-721 判决证书 NFT。Twitter + Telegram 机器人在判决落链的瞬间向整个社区广播。

> **关于链的选择:** Base Sepolia 是本次黑客松的公开 PoC —— 因为我们有一个已经充值的部署者钱包,当天就可以上线。BNB Chain(Chapel 测试网 → 主网,Four.meme 所在的链)只需**一次环境变量切换**即可迁移:`CHAIN_ID`、`RPC_URL`、`EXPLORER_URL` 全部由 env 驱动,零代码改动。**生产目标:BNB Chain**。
>
> **已部署的 VerdictRegistry:** [`0x4f635A02B6Cf998A0508dADE3e2f85e5a2dCAB7a`](https://sepolia.basescan.org/address/0x4f635A02B6Cf998A0508dADE3e2f85e5a2dCAB7a) · Base Sepolia(`84532`)· [部署交易](https://sepolia.basescan.org/tx/0x4dd110c3d520fa7a2a428fa5af8f7823158426a6091b1287d8cc645f8ca3d320)。

每一份判决都是:

- **透明的** —— 完整的 AI 辩论记录在 IPFS,哈希上链承诺,谁都可以核对。
- **不可篡改的** —— 一旦 mint,证书和它对应的 IPFS CID 永远可审计。
- **病毒式的** —— Twitter + Telegram 双通道分发,一次分析保护成千上万交易者。

## 五位 AI 智能体

| 智能体 | 角色 | 数据来源 |
| --- | --- | --- |
| 🔎 **合约审计员** | Solidity 源码静态分析 —— honeypot、隐藏 mint、黑名单陷阱、代理合约套路 | 区块浏览器源码 + 字节码 |
| 💧 **流动性分析师** | LP 大小、锁仓状态、持仓集中度、跑路数学 | 链上 LP pair、LP 持有人 |
| 👤 **Dev 跟踪师** | 部署者钱包历史、资金链、曾经 rug 记录、Tornado 混币关联 | 区块浏览器地址历史、关联地址图 |
| 📣 **舆情观察员** | Twitter/Telegram 讨论量与机器人比例 | X API v2、Telegram 公开频道 |
| 🎯 **叙事匹配师** | 判断当前 Four.meme 主流叙事下这个项目是创新还是抄袭 | Four.meme 趋势榜、最近上线索引 |

判决输出 0–100 的风险分,归并为三档:`LOW_RISK`(低风险)、`MEDIUM_RISK`(中风险)、`HIGH_RISK`(高风险)。

## 架构

```
                       ┌──────────────────────────┐
                       │ Four.meme 新币上线事件   │
                       └────────────┬─────────────┘
                                    │
                  ┌─────────────────▼──────────────────┐
                  │  backend/ —— Bun + Hono 编排器     │
                  │  五位 Claude 智能体 · SSE 流式输出 │
                  └──┬──────────────┬─────────────┬────┘
                     │              │             │
          ┌──────────▼─────┐  ┌─────▼──────┐  ┌───▼────────────┐
          │ IPFS (Pinata)  │  │ Viem RPC   │  │ SSE → 前端 UI  │
          │ ← 推理 JSON    │  │ ↓ mint     │  │ 观众实时围观   │
          └────────────────┘  │ VerdictR.  │  └───────┬────────┘
                              └─────┬──────┘          │
                                    │                 │
                        ┌───────────▼───────────┐     │
                        │ contracts/ — ERC-721  │     │
                        │ VerdictRegistry       │     │
                        │ Base Sepolia (84532)  │     │
                        │ BNB Chapel 路线图上   │     │
                        └───────────┬───────────┘     │
                                    │                 │
                        ┌───────────▼────────────┐    │
                        │ ops/ 发布器轮询        │    │
                        │ /api/verdicts?since=.. │    │
                        │ → 推特 + 电报广播      │◄───┘
                        └────────────────────────┘
```

## Guardian 的独特之处

- **首个多智能体链上尽调工具。** 不是一个大语言模型给一句模糊的意见 —— 五个智能体各有分工、数据源完全分离、失败模式互不相关。
- **辩论可审计。** 分歧本身就是记录的一部分,IPFS 上保存的是每位智能体的完整推理,不只是一个分数。
- **永久证书。** 任何钱包、区块浏览器或 DEX 聚合器都可以永远查询到这份判决 —— NFT 就是凭证。
- **天然病毒式传播。** 推特 + 电报分发意味着一次分析可以保护成千上万交易者,而不只是运行它的那一个人。

## 快速开始

```bash
# 1. 部署合约(本地 anvil / Base Sepolia 测试网 / BNB Chapel 路线图)
cd contracts && forge install && forge build

# 切换 RPC_URL 即可定位到任意 EVM 链;具体链由下游的 CHAIN_ID 推断。
# 示例:anvil (http://127.0.0.1:8545)、Base Sepolia (https://sepolia.base.org)、
#       BNB Chapel (https://data-seed-prebsc-1-s1.binance.org:8545)。
export RPC_URL=https://sepolia.base.org
forge script script/Deploy.s.sol --rpc-url $RPC_URL --broadcast

# 2. 后端 —— 智能体编排器 + SSE API
cd ../backend && cp .env.example .env   # 填入 ANTHROPIC_API_KEY、PINATA_JWT、CONTRACT_ADDRESS 等
bun install && bun run dev              # http://localhost:3001

# 3. 前端 —— 实时 UI
cd ../frontend && bun install && bun run dev   # http://localhost:3000

# 4. ops —— 社交发布器 + IPFS 工具
cd ../ops && cp .env.example .env       # 填入 TWITTER_*、TELEGRAM_*、PINATA_JWT、BACKEND_URL
bun install && bun run dev              # 轮询后端,自动推送到推特 + 电报
```

## 投票 & 分享

这个项目为 [**Four.meme AI Sprint**](https://four.meme) 黑客松打造,提交于 DoraHacks。

**如果你喜欢 Guardian:**

1. ⭐ **在 DoraHacks 上给我们投票** —— 每一票都让这个工具离保护更多华语 degen 更近一步。
2. 🔁 **分享给你的兄弟** —— 把推文和 Telegram 消息转发到你所在的打新群,下一个被 rug 的人可能就因此躲过一劫。
3. 🤝 **加入我们的 Telegram 频道** —— 每一条新判决都会自动广播,第一时间避雷。

感谢 Four.meme 社区、BNB 生态、Base 生态、以及所有早期支持者 🙏

## 许可证

MIT
