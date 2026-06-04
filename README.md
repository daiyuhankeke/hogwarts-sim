# 霍格沃茨日常模拟器

轻量化 AI 文字冒险游戏：霍格沃茨日常、恋爱模拟、三强争霸赛。三分甜、七分现实、无 BE。

## 功能

- 角色创建（学院、年级、血统、攻略对象等）
- AI DM 驱动剧情，每回合 A～F 选项 + 自定义行动
- 好感系统、年度事件日历、三强赛分支
- 本地存档（3 槽位）+ 导出/导入 JSON
- 后端代理 AI API，密钥不暴露给前端

## 快速开始（本地）

### 1. 安装 Node.js

需要 [Node.js 18+](https://nodejs.org/)。

### 2. 配置 API Key

```bash
cd hogwarts-sim
copy .env.example .env
```

编辑 `.env`，填入 `AI_API_KEY`。推荐使用 [DeepSeek](https://platform.deepseek.com)（国内访问方便、成本低）。

### 3. 安装依赖并启动

```bash
npm install
npm run dev
```

浏览器打开 http://localhost:3000 ，创建角色并开始游戏。

## 部署到 Vercel（分享给朋友）

### 1. 推送到 GitHub

```bash
git init
git add .
git commit -m "Initial commit: Hogwarts sim MVP"
git remote add origin https://github.com/你的用户名/hogwarts-sim.git
git push -u origin main
```

### 2. 导入 Vercel

1. 登录 [vercel.com](https://vercel.com)
2. New Project → Import GitHub 仓库
3. **Environment Variables** 中添加：
   - `AI_API_KEY` — 你的 API 密钥
   - `AI_BASE_URL` — 如 `https://api.deepseek.com`
   - `AI_MODEL` — 如 `deepseek-chat`
   - `DAILY_LIMIT` — 可选，如 `50`（防滥用）
   - `INVITE_CODE` — 可选，设置邀请码
4. Deploy

部署完成后获得 `https://xxx.vercel.app` 链接，发给朋友即可。

## 项目结构

```
hogwarts-sim/
├── index.html          # 游戏界面
├── css/style.css       # 霍格沃茨风格样式
├── js/
│   ├── app.js          # 主流程
│   ├── state.js        # 存档与状态
│   ├── ui.js           # 界面渲染
│   └── game-systems.js # 事件日历、结局检测
├── api/chat.js         # Vercel Serverless / 本地 API
├── lib/                # 提示词加载、AI 调用、解析
├── prompts/            # DM 规则与世界观
├── game/state-schema.json
├── server.js           # 本地开发服务器
└── vercel.json
```

## 环境变量说明

| 变量 | 必填 | 说明 |
|------|------|------|
| `AI_API_KEY` | 是 | AI 服务 API 密钥 |
| `AI_BASE_URL` | 否 | API 地址，默认 DeepSeek |
| `AI_MODEL` | 否 | 模型名，默认 deepseek-chat |
| `AI_MAX_TOKENS` | 否 | 单次最大 token，默认 4096 |
| `DAILY_LIMIT` | 否 | 每 IP 每日请求上限，0=不限 |
| `INVITE_CODE` | 否 | 邀请码，不设则不校验 |

## 常见问题

**Q: 点击选项后报错「未配置 AI_API_KEY」**  
A: 本地需在项目根目录创建 `.env` 并填入密钥；Vercel 需在控制台设置环境变量后重新部署。

**Q: AI 返回格式错误**  
A: 点击「重试本回合」。若频繁出现，可换更强模型或检查 `prompts/system-core.md` 中的 JSON 输出规则。

**Q: 霍格莫德去不了**  
A: 需三年级以上且周六，游戏会自动校验。

## 许可

仅供个人与朋友娱乐，哈利·波特相关设定版权归 J.K. Rowling / Warner Bros. 所有。本项目为粉丝向非商业作品。
