# HVT GitHub 仓库更新清单 · v2.1 → v3.1 Beta RC

**对比基线：** `HumanVsTrojan_GitHub_Source_ConnectionFix_v2_1.zip`（旧 GitHub 仓库文件；忽略 `.git/` 历史信息）  
**新版来源：** `Human_vs_Trojan_v3_1_Beta_RC.zip`（CloudBase 相关的 v3.1 Beta RC 统一源文件）  
**本次交付：** GitHub Pages + CloudBase 仓库版（新增项目说明、发布指南、变更清单和 `.gitignore`）

> 下表以**旧仓库根目录的相对路径**作为对比基准。新增文件包含新版本原包带来的代码与本次整理附加的文档。  
> 本次没有修改从 v3.1 Beta RC 继承的游戏运行代码、云函数、SDK 或已附带的部署 ZIP。

## 汇总

| 状态 | 数量 |
| --- | ---: |
| 修改（旧文件路径仍存在，内容发生变化） | **6** |
| 新增（旧仓库中不存在） | **17** |
| 删除（旧文件在新仓库中移除） | **2** |
| 未修改（逐字节相同） | **5** |
| **整理后仓库总文件数（不含 `.git/`）** | **28** |

## 一、修改的文件（6）

| 文件 | 主要变化 |
| --- | --- |
| `README.md` | 替换为中英文双语项目介绍、GitHub Pages + CloudBase 架构及部署入口；不含游戏规则 |
| `app.js` | 更新网页交互，以支持 CloudBase 自动房间并兼容手动连接 |
| `index.html` | 增加自动房间界面与新版模块加载 |
| `js/p2p-room.js` | 更新原有 WebRTC/手动邀请模块，并保留备用连接功能 |
| `package.json` | 版本从 `2.1.0` 升级到 `3.1.0-beta.1`，更新描述 |
| `style.css` | 调整自动房间等新版界面的样式 |

## 二、新增的文件（17）

| 文件 | 用途 |
| --- | --- |
| `.gitignore` | 避免误提交本地依赖、临时文件和密钥文件 |
| `CHANGELOG_GITHUB_V3_1.md` | 本次对比旧仓库的逐项变更记录 |
| `DEPLOY_GITHUB_PAGES_CLOUDBASE.md` | 针对本项目 GitHub Pages + CloudBase 组合的新部署说明 |
| `INTEGRATION_REPORT_CN.md` | 保留 v3.1 Beta RC 的源码整合、校验和测试记录 |
| `SHA256SUMS.txt` | 保留 v3.1 原包的关键源码 SHA-256 校验表 |
| `V3_1_DEPLOY_GUIDE_CN.md` | 保留 v3.1 原包的 CloudBase 静态托管备选说明 |
| `cloudbase.full.js` | 新增本地 CloudBase 浏览器 SDK，支持从 GitHub Pages 加载 |
| `cloudfunctions/hvt-lobby/index.js` | 新增云函数入口，包含排除 `_id` 后回写文档的修复 |
| `cloudfunctions/hvt-lobby/logic.js` | 新增自动房间中转云函数逻辑 |
| `cloudfunctions/hvt-lobby/package.json` | 新增云函数依赖与入口声明 |
| `js/backend-router.js` | 新增自动中转和手动 WebRTC 模式路由 |
| `js/cloud-relay.js` | 新增 CloudBase 消息中转浏览器端实现 |
| `js/online-config.js` | 新增浏览器公开 CloudBase 环境配置 |
| `js/online-signal.js` | 新增 CloudBase SDK 初始化、认证及云函数调用封装 |
| `release/HVT_v3_1_Relay_Function_Beta.zip` | 保留原 Beta 云函数部署 ZIP（含依赖，仅按需部署） |
| `release/HVT_v3_1_Relay_Static_Beta.zip` | 保留原 Beta CloudBase 静态网站部署 ZIP（GitHub Pages 不需要直接上传） |
| `tests/relay.test.mjs` | 新增 CloudBase 中转模拟测试 |

## 三、删除的旧文件（2）

| 文件 | 删除原因 |
| --- | --- |
| `CLOUDBASE_DEPLOY.md` | 旧 v2.1 CloudBase/静态部署说明已过时；用新版部署指南替代 |
| `CONNECTION_FIX_DEPLOY.md` | 旧 v2.1 WebRTC 连接修复部署说明已过时；新版仍保留相关代码和测试 |

这两个旧说明文件的历史内容依然保存在原 v2.1 ZIP 中；它们**不是网页运行依赖**。新版发布说明改用 `DEPLOY_GITHUB_PAGES_CLOUDBASE.md`，同时保留 v3.1 原包的 `V3_1_DEPLOY_GUIDE_CN.md` 作为 CloudBase 静态托管的备选说明。

## 四、未修改的旧文件（5）

| 文件 | 说明 |
| --- | --- |
| `.nojekyll` | 保留 GitHub Pages 静态文件直接发布标志 |
| `js/game-engine.js` | 游戏核心引擎逐字节保持不变 |
| `js/seed43-map.json` | 地图数据逐字节保持不变 |
| `tests/game-engine.test.mjs` | 原游戏引擎测试保持不变 |
| `tests/p2p-room.test.mjs` | 原 WebRTC 测试保持不变 |

## 五、本次采取的保守整理原则

- **保留 v3.1 已验证源代码原样**：`app.js`、`index.html`、`style.css`、全部 `js/` 文件、`cloudfunctions/`、浏览器 SDK、测试以及原 `release/` ZIP 均直接取自新版本压缩包；本次仅重写 `README.md`，并新增说明文件与 `.gitignore`。
- **保护 GitHub 仓库**：没有将旧 ZIP 中的 `.git/` 版本控制内部文件重新打包。应在现有 GitHub 仓库内提交新文件，而非覆盖仓库自己的 Git 历史。
- **避免虚假发布声明**：本次仅在本地执行自动化测试、静态文件检查和打包校验；未替用户在 GitHub 或 CloudBase 在线部署，也未进行真实两机跨网络验收。
- **环境隔离**：CloudBase 的现有线上函数不会因为 GitHub Pages 更新而自动替换。未来更新后端需单独部署云函数。

## 六、校验说明

在 Node.js `v22.16.0` 环境执行 `npm test`，新版 **23/23 项测试通过**。原版的 `SHA256SUMS.txt` 保留供检查关键源码是否与 v3.1 Beta RC 原包一致；该文件不是整个 GitHub 仓库的校验清单。`release/` 中的两个 ZIP 也是原包保留件，并非本次重新生成。
