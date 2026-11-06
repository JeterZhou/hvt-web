# Human vs Trojan v3.1 Beta - CloudBase 消息中转部署与验收

> **测试版，不要覆盖已正常运行的 v2.1 正式游戏。** 本目录是统一后的 v3.1 Beta 候选源码。当前版本号为 `3.1.0-beta.1`。

## 1. 本版的真实改动

- 自动房间模式：双方通过 CloudBase 匿名登录、`hvt-lobby` 云函数及 `hvt_rooms_v3` 文档集合传递游戏指令、结果及双方可见的战局视图；不再依赖 WebRTC 打洞、TURN 或复制 Offer/Answer。
- 手动备用模式：保留 WebRTC 手工交换流程。
- 游戏规则引擎、地图、原有中文/英文界面及角色视角仍基于现有 v3.1 源码。
- 云端安全控制：随机房间身份令牌；令牌哈希入库；两人名额限制；消息大小、待收消息数量限制；服务器检查房间角色；房间有效期最长约 3 小时。
- 仍属 Beta：游戏引擎在房主浏览器运行，并非云端权威对局；不具备刷新后无缝恢复、网络中断期间无限量消息缓存、完整防作弊功能。

## 2. 本次整合后的文件包

统一源码目录包含前端、云函数源码、测试和本指南。可单独使用以下两个部署 ZIP：

- `release/HVT_v3_1_Relay_Static_Beta.zip`：静态网站部署包。ZIP 根目录直接包含 `index.html`、`app.js`、`style.css`、`cloudbase.full.js` 和 `js/`。
- `release/HVT_v3_1_Relay_Function_Beta.zip`：云函数部署包。ZIP 根目录直接包含 `index.js`、`logic.js`、`package.json` 和 `node_modules/`。
- 不要把统一源码 ZIP 直接上传为静态网站包或云函数包。

本次云函数 `index.js` 以你确认来自线上最新成功部署版本的 `hvt-lobby.zip` 为准。`logic.js` 和云函数 `package.json` 与源码包原文件逐字节一致。修复内容是写回数据库前排除系统字段 `_id`。

## 3. CloudBase 控制台设置（环境 `hvt-web-d4gmwj3wb42ec6d22`）

1. 保留 v2.1 原网站及 `hvt-net-probe` 诊断函数。
2. 在文档型数据库中建立集合 `hvt_rooms_v3`，禁止浏览器直接读写；只有云函数服务端访问集合。
3. 如需在独立 Beta 环境部署，建立普通 Node.js 事件云函数，函数名 `hvt-lobby`，运行时 Node.js 20.x，执行方法 `index.main`。
4. 上传 `HVT_v3_1_Relay_Function_Beta.zip`，确认函数 ZIP 根目录直接包含入口文件；按控制台要求安装/识别 `package.json` 中的依赖，确认部署状态正常。
5. 云函数安全规则中只给 `hvt-lobby` 增加已登录用户（含匿名登录）调用的例外。目标条目示例：

```json
"hvt-lobby": {
  "invoke": "auth != null"
}
```

6. 保留原有规则与 `hvt-net-probe` 例外。CloudBase 身份认证中保持匿名登录开启。核实测试域名已获 Web 安全来源许可。不要给匿名用户管理员角色，也不要为方便测试放开全部云函数。
7. 在云函数控制台测试：

```json
{"action":"list"}
```

首次预期类似 `{ "ok": true, "data": { "rooms": [] } }`。这仅验证函数和数据库，不代表双设备联机成功。

**重要：** 你已确认当前线上 `hvt-lobby` 来自最新成功部署版本。本次只是统一本地源码和部署包，不要求你重新部署线上函数。除非之后有明确代码变更并决定发布，否则先不要动当前线上环境。

新版与旧 v3.0 信令版使用同名 `hvt-lobby` 和 `hvt_rooms_v3`，但协议可能不同。请确认没有仍在使用旧 v3.0 云函数的活跃房间，避免两版本混用。正式验证应优先使用独立 CloudBase 测试环境。

## 4. 静态文件及 CloudBase SDK

1. 打开 CloudBase 静态网站托管 → 文件管理，新建或使用 Beta 文件夹 `hvt-cloud-relay-beta/`。
2. 使用 `HVT_v3_1_Relay_Static_Beta.zip`，将 ZIP 内的文件直接上传到这个目录：`index.html`、`app.js`、`style.css`、`cloudbase.full.js` 和 `js/`。不要产生多套重复嵌套目录。
3. **本次静态部署包已经包含 `cloudbase.full.js`**，并放在与 `index.html` 同级的位置。`js/online-config.js` 的 `sdkUrl` 已指向 `./cloudbase.full.js`；加载失败时，代码仍会尝试官方 `latest` CDN 地址。
4. `js/online-config.js` 已预填公开环境 ID `hvt-web-d4gmwj3wb42ec6d22`。Publishable Key 默认留空。如果你的 CloudBase 环境明确要求公开类型 Publishable Key，才填写 `publishableKey`；绝不可填 SecretKey、管理员 API Key。
5. 从 CloudBase **默认托管域名**访问：

   `https://你的实际CloudBase托管域名/hvt-cloud-relay-beta/index.html`

   注意不是仅输入 `hvt-cloud-relay-beta/index.html`。

## 5. 双机验收步骤

1. **先用同一个校园网**：两个浏览器同时打开 Beta 地址，不开 VPN；A 创建自动房间，B 刷新列表并加入。
2. 确认双方显示 `CloudBase 中转 / 已连接`，分别点击准备。等待双方进入地图，并且地图和资源状态加载。
3. A 执行合法攻击操作；确认 B 视图发生对应变化。轮到 B 后由 B 执行防守操作；确认 A 收到结果。记录每次等待时间。
4. **再换不同网络**：A 使用手机热点 1，B 使用手机热点 2，双方不开 VPN 重复整个过程；此项必须专门验收。
5. 选做：校园网与手机移动数据、异地网络交叉测试。
6. 断网 10 秒后恢复，观察是否自动显示重新连接。Beta 会在恢复后继续轮询未确认的消息，但刷新或关闭页面不会自动恢复原会话。

期望：不复制任何 SDP，且游戏指令和双方视图确实正常同步。**只看到“已连接”并不能算完整对局测试通过。**

## 6. 延迟、调用量、风险

- 每位客户端默认约 2.5 秒一次轮询；两人保持对局时仅轮询调用理论约 48 次/分钟，还需加上发送消息和房间操作。
- 上次网络诊断的 4 秒左右往返包括轮询等待，不能直接作为实际物理网络单程延迟。本版还有游戏消息收发与云函数执行开销。
- 免费额度、数据库读写额度及计费以你实际 CloudBase 套餐为准，不能保证长期免费。测试完关闭页面，避免长时间无意义的轮询。
- 房间数据在数据库中不会自动物理删除；建议后续配置 TTL 清理或定期清理过期文档，避免累积。
- 匿名用户调用权限会暴露公共测试接口，应限制测试用户规模、监控调用次数并准备后续频率限制和服务端鉴权升级。

## 7. 排障速查

| 现象 | 排查 |
| --- | --- |
| SDK 无法加载 | 确认 `cloudbase.full.js` 与 `index.html` 同级，检查浏览器 Network 日志；必要时确认 CDN 备用地址可访问 |
| EXCEED_AUTHORITY | 检查匿名登录、云函数安全规则是否包括 `hvt-lobby`，勿改成对所有函数全局放行 |
| list 云函数返回失败 | 检查 `hvt_rooms_v3` 集合是否建立、云函数依赖/入口和数据库权限 |
| 能看见房间但加入失败 | 确认未被别人加入、房间未过期、两台设备访问同一环境和同一版本 |
| 已连接但未进游戏 | 检查双方是否都点击准备，以及浏览器 Console 是否有云函数发送或引擎异常 |
| 不同热点下卡顿 | 记录云函数耗时、每条动作的端到端延迟、轮询日志；不要简单归因为 WebRTC |

## 8. 本次本地整合验证记录

- 静态网站 ZIP 与源码 ZIP 的 10 个共同前端文件逐字节一致。
- 云函数 `logic.js` 与 `package.json` 与线上最新 ZIP 中的文件逐字节一致。
- 云函数 `index.js` 已同步线上最新 ZIP 中排除 `_id` 的修复。
- 静态网站包已包含 `cloudbase.full.js`。
- Node.js `v22.16.0` 下重新运行原有测试：**23 passed，0 failed，0 skipped**。
- `index.js` 与 `logic.js` 语法检查通过。

以上是本地文件与模拟测试结果，不代表线上 CloudBase 数据库事务、真实设备跨网络对局、长时间稳定性或正式发布验收已经完成。
