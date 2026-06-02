# 部署指南

本文档说明如何将霍格沃茨日常模拟器部署到 Vercel，并分享给朋友。

## 前置条件

- [GitHub](https://github.com) 账号
- [Vercel](https://vercel.com) 账号（可用 GitHub 登录）
- 一个 AI API Key（推荐 [DeepSeek](https://platform.deepseek.com)）

## 步骤 1：上传代码到 GitHub

在项目目录打开终端：

```powershell
cd C:\Users\85240\Projects\hogwarts-sim
git init
git add .
git commit -m "Initial commit: Hogwarts daily sim MVP"
```

在 GitHub 创建新仓库 `hogwarts-sim`（不要勾选 README），然后：

```powershell
git remote add origin https://github.com/你的用户名/hogwarts-sim.git
git branch -M main
git push -u origin main
```

## 步骤 2：Vercel 部署

1. 打开 https://vercel.com/new
2. 选择 **Import Git Repository**，选中 `hogwarts-sim`
3. Framework Preset 选 **Other**（无需构建命令）
4. 展开 **Environment Variables**，添加：

| Name | Value |
|------|-------|
| `AI_API_KEY` | 你的 API 密钥 |
| `AI_BASE_URL` | `https://api.deepseek.com` |
| `AI_MODEL` | `deepseek-chat` |
| `DAILY_LIMIT` | `50`（推荐，防止朋友刷爆额度） |

5. 点击 **Deploy**

约 1～2 分钟后获得链接，例如：`https://hogwarts-sim-xxx.vercel.app`

## 步骤 3：分享给朋友

直接把链接发给朋友即可。每人进度保存在各自浏览器本地（localStorage）。

如需分享存档：游戏内点击「导出存档」，把 `.json` 文件发给对方，对方「导入存档」即可。

## 可选：邀请码

若担心链接被陌生人打开消耗 API 额度：

1. Vercel 环境变量添加 `INVITE_CODE=你的暗号`
2. 重新 Deploy
3. 告知朋友暗号（后续可在前端增加输入框，当前版本通过 API body 传递 `inviteCode` 字段）

## 可选：更换 AI 提供商

### OpenAI

```
AI_BASE_URL=https://api.openai.com
AI_MODEL=gpt-4o-mini
AI_API_KEY=sk-...
```

### 通义千问（兼容模式）

```
AI_BASE_URL=https://dashscope.aliyuncs.com/compatible-mode/v1
AI_MODEL=qwen-plus
AI_API_KEY=sk-...
```

修改环境变量后，在 Vercel 控制台点击 **Redeploy**。

## 本地开发 vs 线上

| | 本地 `npm run dev` | Vercel 线上 |
|--|--|--|
| API Key | `.env` 文件 | Vercel 环境变量 |
| 静态文件 | `server.js` 托管 | Vercel CDN |
| API | `server.js` 转发到 `api/chat.js` | Serverless Function |

## 故障排查

**部署成功但 API 500**  
→ 检查 Vercel → Project → Settings → Environment Variables 是否配置正确，且已 Redeploy。

**CORS 错误**  
→ 确保前端请求的是 `/api/chat` 相对路径，不要写 localhost。

**AI 回复乱码或格式错**  
→ 换 `deepseek-chat` 或 `gpt-4o-mini`；点击游戏内「重试本回合」。
