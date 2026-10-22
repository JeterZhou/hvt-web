# Human vs Trojan — CloudBase / GitHub Pages

这是一个纯静态网页游戏项目。游戏界面由 HTML/CSS/JavaScript 提供，双人游戏数据通过浏览器 WebRTC DataChannel 在两名玩家之间直接传输。

## 当前联机方式

当前版本没有 CloudBase 云函数、数据库或自动房间列表。房主创建房间后，需要把 WebRTC 邀请文本发给另一位玩家；加入者生成答复文本，再发回房主。房主应用答复后，双方即可建立点对点连接并开始游戏。

因此，**只要将完整静态文件部署到同一个网站，就可以进行双人联机**。CloudBase 在此版本中只负责可选的静态网站托管，不是游戏通信必需的后端。

## 关键文件

- `index.html`：页面结构和模块入口
- `app.js`：界面、操作和渲染
- `style.css`：样式
- `js/game-engine.js`：游戏规则与状态引擎
- `js/p2p-room.js`：WebRTC 点对点连接和游戏消息
- `js/seed43-map.json`：地图数据
- `tests/`：游戏引擎测试

## 部署

参见 [`CLOUDBASE_DEPLOY.md`](./CLOUDBASE_DEPLOY.md)。

## 本地测试

需要 Node.js；在项目根目录运行：

```bash
npm test
```

注意：当前版本的 WebRTC 信令通过复制邀请/答复文本完成。如果要改成“输入房间号直接加入”、公共房间列表或自动交换信令，需要另行增加 CloudBase 信令服务和对应的前端代码；仅部署静态文件不会自动获得这些功能。


## v2.1 联机状态修复

参见 [CONNECTION_FIX_DEPLOY.md](./CONNECTION_FIX_DEPLOY.md) 了解 GitHub/CloudBase 更新方法。此修复防止重复 Answer 和错误状态提示；未内置 TURN，校园网等限制直连的网络可能仍然无法建立连接。
