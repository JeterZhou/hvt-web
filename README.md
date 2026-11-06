# Human vs Trojan · HVT Web

**网页端 / Web Edition**  
**当前版本 / Current version:** `v3.1.0-beta.1` · Beta Release Candidate

---

## 中文说明

### 项目简介

**Human vs Trojan（HVT）** 是一款面向两名玩家的浏览器在线网络攻防游戏。项目采用纯前端网页呈现战局，提供网络拓扑可视化、实时状态更新以及中文和英文界面。

网页发布在 **GitHub Pages** 上；自动联机服务由 **腾讯云 CloudBase（云开发）** 的身份认证、云函数及数据库提供。前端和云函数源码集中保存在同一个 GitHub 仓库，方便维护、审阅和迭代。

本 README 仅介绍项目和技术部署，不包含游戏规则。游戏规则将另行制作成独立网页。

### 目前提供的体验

- **双人在线对局**：玩家可创建或加入房间，在浏览器中共同参与一场实时战局。
- **自动房间连接**：通过 CloudBase 云函数中转房间信息和对局消息，无需复制 WebRTC 邀请文本。
- **手动连接备用方案**：保留 WebRTC DataChannel 与手工交换邀请／答复文本的连接方式。
- **可视化战局界面**：提供可交互网络拓扑、战局状态、操作面板及事件日志。
- **中英文界面**：可在页面中切换语言。

### 技术架构

| 组成 | 技术与职责 |
| --- | --- |
| GitHub Pages | 托管 HTML、CSS、JavaScript 与 CloudBase 浏览器 SDK 等静态文件 |
| 浏览器前端 | 页面、可视化、界面交互与当前对局的游戏引擎 |
| CloudBase 云身份认证 | 为自动房间提供匿名登录身份 |
| CloudBase 云函数 `hvt-lobby` | 处理房间操作和双方消息中转 |
| CloudBase 数据库 `hvt_rooms_v3` | 保存房间及消息相关记录 |
| WebRTC | 手动邀请模式的备用点对点连接 |

**重要：** GitHub Pages 只托管静态文件，不会运行 `cloudfunctions/` 下的 Node.js 云函数；云函数仍需在 CloudBase 环境中部署和维护。

### 仓库目录

```text
.
├── index.html                 网页入口
├── app.js                     页面交互与渲染
├── style.css                  页面样式
├── cloudbase.full.js          CloudBase 浏览器 SDK（本地副本）
├── js/                        游戏引擎、连接方式与前端配置
│   ├── game-engine.js
│   ├── backend-router.js
│   ├── cloud-relay.js
│   ├── online-config.js
│   ├── online-signal.js
│   ├── p2p-room.js
│   └── seed43-map.json
├── cloudfunctions/hvt-lobby/   CloudBase 云函数源码
├── tests/                     自动化测试
├── release/                   已提供的 Beta 静态与云函数部署 ZIP
├── DEPLOY_GITHUB_PAGES_CLOUDBASE.md
├── V3_1_DEPLOY_GUIDE_CN.md   CloudBase 静态托管备选部署记录
├── CHANGELOG_GITHUB_V3_1.md  与旧 GitHub 文件的差异清单
└── README.md                  本文件
```

`release/` 是保留的历史 Beta 部署产物；使用 GitHub Pages 时，**直接部署仓库根目录中的静态网页文件**，不需要再上传 `release/` 中的静态 ZIP。CloudBase 云函数源码也保留在仓库中，但不会被 GitHub Pages 执行。

### 发布与配置

1. 将本仓库文件（包括 `.nojekyll`）放在 GitHub 仓库 `main` 分支根目录；使用 GitHub **Settings → Pages → Deploy from a branch → main / (root)** 发布网页。
2. 确认 CloudBase 的匿名身份认证、`hvt-lobby` 云函数、`hvt_rooms_v3` 数据库集合，以及 Web 安全来源设置与 GitHub Pages 网站域名匹配。
3. 检查 `js/online-config.js` 的公开环境 ID 和云函数名。当前源码预填测试环境 ID；如改用别的环境，请更新公开配置。
4. 使用两个不同浏览器／网络实际验证创建房间、加入、准备和完整消息交换。

具体操作、发布边界和风险请阅读 **[GitHub Pages + CloudBase 部署指南](./DEPLOY_GITHUB_PAGES_CLOUDBASE.md)**。CloudBase 静态托管的备选流程另见 [v3.1 原部署指南](./V3_1_DEPLOY_GUIDE_CN.md)。

### 本地测试与版本状态

```bash
npm test
```

建议使用 Node.js 20 或更新版本。当前仓库在 Node.js `v22.16.0` 下完成 **23 项自动化测试，全部通过**。这些是本地引擎、WebRTC 状态和模拟 CloudBase 中转测试，**不等于已完成真实线上环境或跨网络端到端验收**。

当前版本为 **Beta RC**：房主浏览器仍负责运行对局引擎，刷新页面不能无缝恢复会话，自动房间轮询存在延迟与云端调用成本。正式公开发布前，应进一步验证跨网络体验、服务配额、房间清理和安全限流。

**安全提示：** 仅将公开 CloudBase 环境标识和必要的可公开配置放入前端代码。**切勿**向 GitHub 提交 SecretId、SecretKey、管理员凭据、私钥或其他服务器端密钥。

### 未来的升级版本

当前版本（v3.1）采用房主单端执行游戏逻辑、客机发送指令并等待服务端转发的架构，客机执行技能与交互时存在明显延迟，操作流畅度受限。

规划下一版本 **HVT v3.2 · Turn-Based Sync**，目标改造为回合制同步架构：双方独立本地运行游戏引擎，技能与操作在本地即时执行，不再等待云端响应；仅在回合关键节点提交操作日志、状态校验信息，完成跨端同步。

该方案依托现有引擎的确定性随机数与分角色快照信息隔离机制，保证双方对局状态一致、隐藏对局信息不泄露；配套提交编号、状态哈希、ACK 确认、重试与断线恢复能力，规避重复执行、数据不一致问题。同时优化云端通信机制，减少无意义轮询，大幅降低 CloudBase 云函数调用与数据库读写频次。

开发将采用增量改造思路，保留稳定可用的 v3.1 版本，分阶段完成架构分析、同步协议实现、跨设备网络异常测试、性能与资源消耗对比验证，确认稳定可用后再正式启用这套双端本地计算、回合提交同步的联机架构。

---

## English

### About the project

**Human vs Trojan (HVT)** is a two-player browser-based cyber strategy game. The web edition offers an interactive network visualization, live match status, and an interface available in Chinese and English.

The website is hosted on **GitHub Pages**, while **Tencent CloudBase** provides the authentication, cloud function, and database services used for automatic online rooms. Both the frontend and cloud-function source are maintained in one GitHub repository.

This README covers the project and its technical setup only. Game rules will be presented on a separate webpage.

### Highlights

- **Two-player online sessions:** create or join a room from a browser.
- **Automatic CloudBase rooms:** relay room events and game messages through a cloud function, without manually exchanging WebRTC invitation text.
- **Manual connection fallback:** preserve WebRTC DataChannel connectivity through manual offer/answer exchange.
- **Interactive match display:** explore a network topology with status, controls, and event logs.
- **Bilingual interface:** switch between Chinese and English.

### Architecture

| Component | Responsibility |
| --- | --- |
| GitHub Pages | Serves static HTML, CSS, JavaScript, and the browser CloudBase SDK |
| Browser frontend | UI, visualization, interactions, and the current match engine |
| CloudBase authentication | Anonymous sign-in for automatic rooms |
| `hvt-lobby` cloud function | Room management and message relay |
| `hvt_rooms_v3` collection | Room and message data |
| WebRTC | Optional peer-to-peer transport for manual connection mode |

**Note:** GitHub Pages does not run Node.js cloud functions. Files under `cloudfunctions/` are tracked in GitHub, but the function must run in CloudBase.

### Repository layout

The website entry point is `index.html`; `app.js` and `style.css` provide its UI. The `js/` directory contains the game engine, networking modules, and public frontend configuration. `cloudfunctions/hvt-lobby/` contains the server-side function, `tests/` contains automated tests, and `release/` retains the supplied Beta deployment ZIPs.

The `release/` artifacts are optional for a GitHub Pages deployment: the website is published directly from the repository root. See [the complete file-by-file changes](./CHANGELOG_GITHUB_V3_1.md).

### Deployment

1. Place the extracted repository files, including `.nojekyll`, in the root of your GitHub repository's `main` branch. Enable **Settings → Pages → Deploy from a branch → main / (root)**.
2. Check that CloudBase anonymous authentication, the `hvt-lobby` function, the `hvt_rooms_v3` collection, and the allowed browser origin are configured for the GitHub Pages domain.
3. Verify the public environment ID and function name in `js/online-config.js`. Adjust these only when using a different CloudBase environment.
4. Test the complete room and message flow on two actual browsers and different networks.

Read the [GitHub Pages + CloudBase deployment guide (Chinese)](./DEPLOY_GITHUB_PAGES_CLOUDBASE.md) for exact steps and cautions. [The original v3.1 CloudBase static-hosting guide](./V3_1_DEPLOY_GUIDE_CN.md) remains available for the alternative deployment approach.

### Local testing and release status

Run `npm test` with Node.js 20+. In the current package, **all 23 automated tests passed** on Node.js `v22.16.0`. These cover local game logic, WebRTC connection states, and simulated CloudBase relay behavior. They **do not establish that a live CloudBase deployment or real cross-network match has passed end-to-end acceptance testing**.

This is a **Beta Release Candidate**, not a guaranteed production release. The host browser remains authoritative for the match, refreshing a page does not seamlessly restore a room session, and automatic-room polling incurs latency and cloud usage. Validate real-device connectivity, quotas, room cleanup, and rate limits before a wider launch.

**Security:** Commit public identifiers only. Never commit Tencent Cloud SecretId/SecretKey, administrative credentials, private keys, or other server-side secrets to this public repository.

### Future Version Upgrade

The current release (v3.1) runs game logic entirely on the host. Clients send commands and wait for relay through the cloud, which introduces noticeable latency for skill casts and interactions and hurts responsiveness.

The planned next milestone, **HVT v3.2 · Turn-Based Sync**, will shift to a turn-based synchronization architecture. Both players will run the game engine locally: skills and actions execute instantly on the local device without waiting for cloud replies. Game state synchronization only happens at critical turn boundaries.

Built upon the existing deterministic random generator and role-based snapshot isolation, this design guarantees consistent simulation on both sides while preserving hidden information. It introduces commit IDs, state hashes, ACK handshakes, retry logic and reconnection recovery to prevent duplicate action execution and state desync. Cloud communication will also be reworked to eliminate unnecessary polling, cutting down CloudBase function invocations and database traffic.

This will be implemented incrementally without breaking the stable v3.1 branch. Development will proceed in phases: architecture audit, sync protocol implementation, cross-device stress tests including network failure scenarios, and benchmarking against the current version. The new dual-local simulation + turn-commit networking stack will only be adopted after validation.
