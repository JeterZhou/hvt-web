# Human vs Trojan v3.1 Beta RC：GitHub Pages + CloudBase 部署指南

> 本指南对应 **GitHub Pages 托管网页 + CloudBase 执行云函数和数据库** 的方案，而非将网站托管在 CloudBase 静态网站服务中。  
> 版本为 `v3.1.0-beta.1`。这是 Beta RC，不能把本地测试通过直接等同于正式上线验收。

---

## 1. 本仓库如何分工

- **GitHub Pages**：托管根目录的 `index.html`、`app.js`、`style.css`、`cloudbase.full.js`、`js/` 和 `.nojekyll` 等静态文件。
- **CloudBase**：执行 `cloudfunctions/hvt-lobby/` 中的云函数，提供匿名身份认证及 `hvt_rooms_v3` 数据集合。
- **手动备用模式**：在浏览器间使用 WebRTC，无需 CloudBase 消息中转，但需要手工交换邀请与答复。

GitHub Pages 不会自动部署 `cloudfunctions/`。将云函数源码放在 GitHub 中，**不代表 CloudBase 云函数会自动更新**。本次提供的 GitHub ZIP 也不会自动上传到 GitHub 仓库，需要手动提交或推送。

## 2. 将仓库部署到 GitHub Pages

1. 建议先备份当前 `main` 分支或创建 Beta 测试分支，避免直接覆盖现有可用版本。
2. 解压 `HumanVsTrojan_GitHubPages_CloudBase_v3.1_BetaRC_Repository.zip`。
3. 把**解压后的全部内容**放到 GitHub 仓库根目录。`index.html` 必须直接位于仓库根目录，不能多嵌套一个版本文件夹；`.nojekyll` 也要上传。
4. 在仓库进入 **Settings → Pages → Build and deployment**：`Source` 选 **Deploy from a branch**，`Branch` 选 **main**，目录选 **/(root)** 并保存。如果使用其他分支，以实际发布分支为准。
5. 等待 GitHub Pages 发布完成，然后打开 `https://<你的GitHub用户名>.github.io/<仓库名>/`。例如仓库名为 `hvt-web`，地址路径通常以 `/hvt-web/` 结尾。
6. 检查页面是否能加载；在浏览器开发者工具 Network 中确认 `index.html`、`app.js`、`cloudbase.full.js` 与 `js/` 中的模块均正常返回。网页使用 `./` 相对路径，支持 GitHub Pages 的项目子目录。

**注意：** GitHub 的网页上传功能不会自动解压 ZIP。不要只把仓库 ZIP 当作单个文件上传，否则 Pages 找不到根目录的 `index.html`。本 ZIP 不包含旧版本上传包里的 `.git/` 历史信息，适合复制到现有仓库后提交。

## 3. 核实 CloudBase 服务

当前前端 `js/online-config.js` 已设定以下公开配置：

```js
export const ONLINE_CONFIG = Object.freeze({
  env: 'hvt-web-d4gmwj3wb42ec6d22',
  publishableKey: '',
  functionName: 'hvt-lobby',
  sdkUrl: './cloudbase.full.js',
});
```

请在你自己的 CloudBase 控制台核实：

1. 使用正确的 CloudBase 环境；如果环境不同，更新公开环境 ID。
2. 开启供自动房间使用的**匿名登录**，并允许 GitHub Pages 的网站来源（通常为 `https://<用户名>.github.io`；以控制台的实际域名配置要求为准）。
3. 云函数 **`hvt-lobby`** 已经部署，入口 `index.main`，运行时和依赖兼容。函数依赖 `@cloudbase/node-sdk`，具体声明在 `cloudfunctions/hvt-lobby/package.json`。
4. 文档数据库存在 **`hvt_rooms_v3`** 集合。房间数据由云函数访问；不要为了调试而将集合直接开放给所有匿名浏览器读写。
5. 云函数调用权限只允许必要的已登录用户（含匿名身份）；例如特定函数的权限配置可参考原部署指南中的 `auth != null` 条件。不要全局放开所有函数。
6. 如你的环境要求 *Publishable Key*，只填写**明确可以公开使用**的那一类客户端 Key；绝不可将 SecretKey、管理员 API Key 或其他服务端凭据写入前端文件。

**若此前 `hvt-lobby` 已按当前 v3.1 协议成功部署：** 仅更新 GitHub Pages 的前端文件通常**无需再次部署云函数**。只有 CloudBase 环境缺少函数、配置不一致，或你明确决定发布新的后端代码时，才更新后端。旧版 v3.0 信令函数可能与此版协议不兼容，不应在同一活跃房间中混用。

## 4. 后端源码与已有部署产物

- 源代码位于 `cloudfunctions/hvt-lobby/`，包括 `index.js`、`logic.js` 和 `package.json`。
- 已附带的 Beta 函数部署产物位于 `release/HVT_v3_1_Relay_Function_Beta.zip`，ZIP 内自带 `node_modules/`。只有需要更新云函数时才考虑使用，部署前务必复核目标环境。
- `release/HVT_v3_1_Relay_Static_Beta.zip` 是原版 **CloudBase 静态托管**的部署产物，**不是** GitHub Pages 所需的文件上传方式。
- 源码中已保留排除数据库系统字段 `_id` 后写回文档的修复（`cloudfunctions/hvt-lobby/index.js`）。

## 5. 发布后验收

1. 在两个浏览器分别打开 GitHub Pages 站点，创建及加入一个 CloudBase 自动房间。
2. 确认房间状态、准备状态及双方视图均能更新，执行实际操作并观察消息同步。
3. 在两个独立网络（例如两个手机热点）重复整套流程；不要以“显示已连接”代替消息端到端验收。
4. 单独检查手动 WebRTC 备用连接是否仍可用。
5. 观察 CloudBase 云函数调用量、数据库存储、错误日志和延迟；确认是否有需要的安全限频及过期文档清理。

本次在 Node.js `v22.16.0` 上运行 **23/23 项本地测试通过**。未在本次交付过程中访问、变更或验收你的实际 GitHub / CloudBase 线上部署。刷新后无缝恢复、长期网络稳定性、资源配额及安全性仍需进一步验证。

## 6. 常见问题

| 现象 | 优先检查 |
| --- | --- |
| 打开 Pages 返回 404 | Pages 分支、目录设置；`index.html` 是否在仓库根目录；发布是否完成 |
| 页面有样式但游戏不初始化 | 浏览器 Console、模块相对路径、`app.js` 与 `js/` 是否上传完整 |
| 自动房间无法连接 | CloudBase 环境 ID、匿名认证、网站来源白名单、函数名、权限及函数日志 |
| 能见房间但游戏消息未同步 | 数据库集合、云函数协议版本、双方是否准备及浏览器控制台错误 |
| CloudBase SDK 载入失败 | `cloudbase.full.js` 是否与 `index.html` 同级及网络请求情况；代码含官方 CDN 备用地址 |
| 手动 WebRTC 连接失败 | 两端完整交换邀请／答复；检查 ICE/网络限制，不能保证所有网络可直连 |

---

**相关文档：** [项目简介（中英双语）](./README.md) · [完整增删改清单](./CHANGELOG_GITHUB_V3_1.md) · [原 v3.1 CloudBase 静态托管备选指南](./V3_1_DEPLOY_GUIDE_CN.md)
