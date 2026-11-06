# v3.1 Beta RC 整合检查报告

## 一、输入文件

1. `HVT_v3_1_Relay_Source_Beta.zip`：项目源码、3 个测试文件、云函数逻辑源码和部署指南。
2. `hvt-cloud-relay-beta.zip`：静态网站文件及 `cloudbase.full.js`。
3. `hvt-lobby.zip`：你确认来自 CloudBase 线上最新成功部署版本的云函数文件及 Node SDK 依赖。

## 二、对比结果

### 前端

源码 ZIP 与静态网站 ZIP 的 10 个共同文件逐字节一致：

- `app.js`
- `index.html`
- `style.css`
- `js/backend-router.js`
- `js/cloud-relay.js`
- `js/game-engine.js`
- `js/online-config.js`
- `js/online-signal.js`
- `js/p2p-room.js`
- `js/seed43-map.json`

因此没有对这些前端代码做覆盖或手工合并。

### CloudBase 云函数

| 文件 | 对比结果 | 处理 |
|---|---|---|
| `index.js` | 源码 ZIP 仍是 `await doc.set(entry)`；线上 ZIP 已排除 `_id` | 用线上 ZIP 的 `index.js` 更新本地源码 |
| `logic.js` | 两个 ZIP 逐字节一致 | 保留 |
| `package.json` | 两个 ZIP 逐字节一致 | 保留 |

修复后的关键代码：

```javascript
const { _id, ...entryData } = entry;
await doc.set(entryData);
```

本次没有改动游戏引擎、Relay 逻辑或原有测试文件。

### CloudBase 浏览器 SDK

静态网站 ZIP 中包含有效的 `cloudbase.full.js`（970,448 bytes）。已复制到统一项目根目录，与 `index.html` 同级；静态部署 ZIP 也包含该文件。

## 三、测试结果

在整合后的项目目录执行：

```bash
node --test tests/*.test.mjs
```

结果：

| 测试文件 | 通过数 |
|---|---:|
| `tests/game-engine.test.mjs` | 12 |
| `tests/p2p-room.test.mjs` | 2 |
| `tests/relay.test.mjs` | 9 |
| **合计** | **23/23** |

运行环境：Node.js `v22.16.0`。  
失败：0；跳过：0。  
云函数 `index.js` 和 `logic.js` 语法检查通过。

## 四、交付包

- `HVT_v3_1_Relay_Static_Beta.zip`：静态网站文件平铺在 ZIP 根目录，适合上传到 CloudBase Beta 静态托管文件夹。
- `HVT_v3_1_Relay_Function_Beta.zip`：云函数入口文件平铺在 ZIP 根目录，并带有原云函数 ZIP 中的 `node_modules/` 运行依赖；已排除 `.vscode/` 与 `.tcb_tmp/` 编辑器/临时目录。
- `Human_vs_Trojan_v3_1_Beta_RC_Source.zip`：统一源码、测试、部署指南、整合报告及上述两个部署 ZIP。

## 五、仍未完成的验收

1. `CloudRelay.resume()` 仍明确提示刷新后需要重新加入房间，刷新恢复尚未实现。
2. 23 项测试使用本地模拟，不是对真实 CloudBase 数据库和线上云函数的端到端验证。
3. 两个独立手机热点、连续多局、长时间稳定性仍需要真实设备验收。
4. 成本、数据库过期房间物理清理、限频与安全运营仍需单独验收。

## 六、操作建议

- 保留 v2.1 正式版，不要直接覆盖。
- 本次只是本地源码和部署包整合，不要求重新部署当前线上 `hvt-lobby`。
- 先在独立 Beta 环境使用静态部署包验证；只有明确需要更新云函数时，才使用函数部署包。
