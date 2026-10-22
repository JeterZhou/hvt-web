# Human vs Trojan — WebRTC 连接状态修复 v2.1

## 本次修复范围

- 保留游戏规则、地图、战斗流程、已有页面设计，`js/game-engine.js`、`js/seed43-map.json`、`style.css`、`index.html` 不变。
- 修复房主重复应用 Answer 引发的 `Called in wrong state: stable`：答复成功应用后后端禁止重复设置 `setRemoteDescription`，前端按钮不再重新启用。
- 显示不同连接阶段：等待答复、正在连接、已连接、连接中断、连接失败、已关闭，而不是所有未联机状态都显示正在重连。
- 连接失败时提示双方返回首页并重新交换全新邀请/答复；**不会假装自动恢复已失败的 WebRTC 会话**。
- 保留 ICE 候选收集完成才输出邀请/答复的逻辑。
- 不新增后台、数据库、云函数、TURN；当前仍使用手工复制 Offer/Answer。

## 应该使用哪个包？

1. `HumanVsTrojan_GitHub_Source_ConnectionFix_v2_1.zip`：完整 GitHub 源码。解压后，将**文件夹里面**的文件放到 GitHub 仓库根目录，`index.html` 要直接位于根目录。包含 `tests`、`package.json`、文档；不含旧包中的 `.git` 元数据。
2. `HumanVsTrojan_Static_ConnectionFix_v2_1.zip`：纯静态托管包。ZIP **根目录**就是 `index.html`、`app.js`、`style.css`、`js/`，可用于 CloudBase 静态托管或 GitHub Pages；没有 Node.js 构建步骤。

### 推荐的更新方法（你的网站正在使用 GitHub Pages）

- **仅要修复现有游戏**：在 GitHub 仓库中替换 `app.js` 和 `js/p2p-room.js` 两个文件，提交到 Pages 使用的分支。两台电脑随后强制刷新。
- **想同步一份完整源码**：使用第一个包，把所需源文件同步到仓库；不要上传 `node_modules` 或 `.git`。
- **只有当 CloudBase 也托管一份让玩家实际访问的网页时**，才需要向 CloudBase 同步 `app.js` 和 `js/p2p-room.js`。仅仅创建 CloudBase 环境/数据库，并不要求复制前端文件。
- 如果在 CloudBase 使用代码构建部署，静态仓库根目录项目框架选其他，安装和构建命令可留空，产物目录为 `./`（取决于对应部署入口是否支持这些设置）。

## 联机步骤与失败处理

1. 房主创建新的邀请并发给朋友。
2. 朋友在同一个版本的网站中生成新的答复并发回。
3. 房主**只点击一次**「应用答复并连接」。按钮随后会锁定，直到双方返回首页发起新一轮会话。
4. 两边显示「已连接」后，再点击「准备就绪」。
5. 如果显示「连接失败」，请双方返回首页，**重新生成新的邀请和答复**。重复粘贴旧答复无法重建 ICE 连接。
6. 用户此前在手机热点下实测完成一局，而校园网失败；当前版本**没有 TURN**。学校可能限制直连。换网络可作为临时方案，但不代表已修复校园网限制。后续如需覆盖限制较严格的网络，需要部署可访问的 TURN 服务并安全分发临时凭证。

## 自检

在源码根目录使用 Node.js 运行 `npm test`。测试包括原来的游戏规则测试，以及模拟 WebRTC 的答复去重与状态切换测试。**这些自动测试不能代替两台实际设备的联网验收。**
