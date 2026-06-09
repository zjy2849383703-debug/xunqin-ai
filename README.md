# 寻亲 AI · 温暖回家

基于 AI 的老照片修复与年龄增长预测公益工具，前端可纯静态托管。

## 前端部署（静态托管）

`public/` 目录可直接部署到任意静态托管平台：

1. **GitHub Pages** — 上传 `public/` 到 GitHub，开启 Pages
2. **腾讯 EdgeOne** — 上传 `public/` 作为静态站点
3. **Vercel / Netlify** — 直接部署 `public/` 目录

### 配置后端 API

修改 `public/js/config.js`：

```js
window.XunqinConfig = {
  API_BASE: 'https://your-api-domain.com',  // 后端部署地址
};
```

若不修改（`API_BASE: ''`），则 API 请求走同域，需同时部署后端。

## 后端部署

后端是 Node.js + Express 服务，需要独立部署（支持 VPS、SCF 云函数等）：

```bash
cp .env.example .env   # 填入豆包 API Key
npm install
node server.js
```

### API 接口

| 接口 | 功能 |
|---|---|
| `POST /api/grow-age` | 年龄增长预测 |
| `POST /api/restore-photo` | 老照片修复 |
| `POST /api/clues` | 线索上报 |

## 技术栈

- 前端：原生 HTML / CSS / JavaScript
- 后端：Node.js + Express
- AI 模型：豆包 Seedream（火山引擎）
