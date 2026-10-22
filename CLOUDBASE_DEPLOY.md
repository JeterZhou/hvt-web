# CloudBase 部署说明

## 方案 A：CloudBase 直接托管静态网站（适合当前版本）

1. 解压 `HumanVsTrojan_Static_ConnectionFix_v2_1.zip`。确认 `index.html` 直接位于解压目录根部，而不是更深一层子目录。
2. 打开腾讯云开发 CloudBase 控制台，进入对应环境的“静态网站托管”。
3. 选择“新建部署”并上传代码包或文件夹。
4. 当前项目是纯 HTML/CSS/JavaScript，无需构建：安装命令留空、构建命令留空；如果页面要求填写构建产物目录，填 `.`（当前目录）。
5. 部署完成后，打开 CloudBase 分配的网站地址，确认首页可正常加载。

CloudBase 静态托管官方文档：
- https://docs.cloudbase.net/hosting/web-hosting-static
- https://docs.cloudbase.net/hosting/quick-start

## 方案 B：用 CloudBase CLI 上传

先安装 Node.js，然后在终端执行：

```bash
npm install -g @cloudbase/cli
tcb login
```

进入解压后的静态网站目录（该目录中应直接有 `index.html`），执行：

```bash
tcb hosting deploy . -e <你的CloudBase环境ID>
```

将 `<你的CloudBase环境ID>` 替换成 CloudBase 控制台里的环境 ID。不要把 `.git/`、密钥或本地配置文件上传到静态网站目录。

## 哪些文件必须放在 CloudBase 静态网站中

```text
index.html
app.js
style.css
.nojekyll
js/
  game-engine.js
  p2p-room.js
  seed43-map.json
```

这些文件必须保持原有相对目录结构。不要只上传 `index.html`，否则页面样式、游戏逻辑或地图数据会加载失败。

## GitHub 应该放哪些文件

GitHub 仓库可以保留完整项目源码：

```text
index.html
app.js
style.css
.nojekyll
js/
  game-engine.js
  p2p-room.js
  seed43-map.json
package.json
tests/
README.md
CLOUDBASE_DEPLOY.md
```

不需要提交 `.git/`（Git 自己管理）、`node_modules/` 或个人密钥。若要使用 GitHub Pages 作为玩家访问的网址，也要确保以上静态文件位于 Pages 的发布根目录中。

## 当前联机功能的边界

本项目当前采用 WebRTC 点对点数据通道。CloudBase 静态托管和 GitHub Pages 都只负责发放网页文件；它们不会自动创建公共房间列表，也不会自动交换 WebRTC 邀请/答复文本。

如果希望玩家只输入房间号就能加入、看到在线房间、自动交换连接信息，则需要额外部署 CloudBase 信令后端（例如云函数/数据库或经过配置的实时频道），并修改 `js/p2p-room.js` 与房间界面。当前这份静态部署包没有假装提供这些功能。

## v2.1 修复版补充

请优先参见 [`CONNECTION_FIX_DEPLOY.md`](./CONNECTION_FIX_DEPLOY.md)。当前已修复重复提交 Answer 与连接状态提示；校园网阻止 WebRTC 直连时仍需可用 TURN 中继或更换网络。
