# 推送到 GitHub

本地仓库已配置完成，远程地址：

`https://github.com/daiyuhankeke/hogwarts-sim.git`

## 第一次推送

在项目目录打开 **PowerShell** 或 **Git Bash**，依次执行：

### 方式 A：GitHub CLI（推荐）

```powershell
cd C:\Users\85240\Projects\hogwarts-sim
gh auth login
git push -u origin main
```

`gh auth login` 选择：GitHub.com → HTTPS → Login with a web browser

### 方式 B：仅 Git

```powershell
cd C:\Users\85240\Projects\hogwarts-sim
git push -u origin main
```

浏览器会弹出 GitHub 登录窗口。

## 若连接 GitHub 失败

国内网络可能出现 `Connection reset` 或超时，可尝试：

1. 开启 VPN / 代理后再 push
2. 为 Git 配置代理（将 `7890` 换成你的代理端口）：
   ```powershell
   git config --global http.https://github.com.proxy http://127.0.0.1:7890
   ```
3. 改用 SSH（需先在 GitHub 添加 SSH 公钥）：
   ```powershell
   git remote set-url origin git@github.com:daiyuhankeke/hogwarts-sim.git
   git push -u origin main
   ```

## 推送成功后

在浏览器打开 https://github.com/daiyuhankeke/hogwarts-sim 应能看到全部项目文件。

**注意：** `.env`（含 API Key）已在 `.gitignore` 中，不会被上传。
