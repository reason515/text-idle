# 云端部署（内部测试 MVP）

部署单个 Linux 二进制（内嵌前端）、磁盘 SQLite，以及通过 Caddy 提供 HTTPS。本地 zip 分发见 [distribution.md](./distribution.md)。

## 前置条件

- 一台 VPS（推荐 Ubuntu 22.04+），可 SSH 访问
- 一个域名，**A 记录**指向 VPS 公网 IP
- 防火墙：放行 **22**（SSH）、**80**、**443**
- 构建机器上：Node.js、Go 1.22+、npm

## 构建 Linux 发布二进制

在 Linux 或 WSL 上，从仓库根目录执行：

```bash
bash scripts/build-dist.sh
```

在 Windows 上交叉编译（PowerShell），使用现有脚本：

```powershell
$env:GOOS="linux"; $env:GOARCH="amd64"; npm run build:dist
```

输出：`dist/text-idle`（Linux amd64，前端已内嵌）。

## 一键部署（腾讯云，无域名）

### 当前内部测试服务器

| 项目 | 值 |
|------|--------|
| 公网 IP | `119.45.224.68` |
| SSH 用户 | `root`（本实例为 TencentOS；Ubuntu 镜像常用 `ubuntu` — 需传 `-SshUser`） |
| SSH 密钥（本地，**切勿**提交到仓库） | `D:\docs\tencent cloud key\reason515.pem` |
| 游戏端口 | `8080` |
| 注册地址 | http://119.45.224.68:8080/register |
| 安全组（入站） | **22**、**8080** |

当前未使用域名和 HTTPS；通过公网 IP + 端口访问。

### 部署（复制粘贴）

在 Windows 上，从**项目根目录**直接运行 PowerShell（推荐）：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/deploy-tencent.ps1 -KeyPath "D:\docs\tencent cloud key\reason515.pem" -SshUser root
```

> **不要使用** `npm run deploy:tencent -- -KeyPath "..."` — npm 不会把 `-KeyPath` 转发给脚本。密钥路径（尤其含空格时）会被拆成错误参数，导致 `scp`/`ssh` 报 `Permission denied (publickey)`。

代码变更后重新执行同一命令即可上传新二进制（服务器会先备份现有数据库）。

### 验证与运维

```powershell
# 公网健康检查
Invoke-WebRequest -Uri "http://119.45.224.68:8080/health" -UseBasicParsing

# SSH 登录
ssh -i "D:\docs\tencent cloud key\reason515.pem" root@119.45.224.68

# 跟踪服务日志
ssh -i "D:\docs\tencent cloud key\reason515.pem" root@119.45.224.68 "journalctl -u text-idle -f"

# 在服务器上手动备份数据库
ssh -i "D:\docs\tencent cloud key\reason515.pem" root@119.45.224.68 "bash /opt/text-idle/backup-db.sh /var/lib/text-idle/text-idle.db /var/backups/text-idle"
```

### 脚本参数

| 参数 | 默认值 | 含义 |
|------|---------|---------|
| `-KeyPath` | （必填） | 本地 SSH 私钥（`.pem`） |
| `-ServerHost` | `119.45.224.68` | VPS 公网 IP |
| `-SshUser` | `ubuntu`（脚本默认） | SSH 登录用户；当前腾讯测试 VPS 请用 **`root`** |
| `-Port` | `8080` | 游戏 HTTP 端口 |

脚本会构建 Linux 二进制、通过 `scp` 上传、安装 `systemd` 服务，并执行 `/health` 检查。

**账号数据：** 玩家账号保存在 `/var/lib/text-idle/text-idle.db`。常规重新部署**不会**删除该文件。若所有旧账号无法登录但新注册正常，请检查是否执行过 `reset-prod-data` 或手动删除了数据库文件。邮箱存储与匹配**不区分大小写**（v0.2.x 起）；注册时用什么拼写均可，大小写无关。

### 重置生产数据（清空所有玩家） {#reset-production-data-wipe-all-players}

当需要在线上 VPS 进行**全新内部测试**时使用。会删除 `/var/lib/text-idle/text-idle.db`（账号、存档、排行榜、留言板、队名占用）。游戏二进制和 systemd 服务**不会被**移除。

**安全机制：** 删除前会先写入备份到 `/var/backups/text-idle`。Windows 包装脚本必须传 **`-Confirm`**（或在服务器脚本上设置 `TEXT_IDLE_RESET_CONFIRM=yes`）。

在 Windows 上，从**项目根目录**执行：

```powershell
powershell -ExecutionPolicy Bypass -File scripts/reset-prod-data-tencent.ps1 -KeyPath "D:\docs\tencent cloud key\reason515.pem" -SshUser root -Confirm
```

或直接在 VPS 上（复制 `scripts/reset-prod-data.sh` 或粘贴到 `/tmp` 后）：

```bash
sudo TEXT_IDLE_RESET_CONFIRM=yes bash /tmp/reset-prod-data.sh
```

重置后打开 http://119.45.224.68:8080/register — 下次服务启动时 GORM 会重建空表。

| 重置脚本参数 | 默认值 | 含义 |
|-------------------|---------|---------|
| `-KeyPath` | （必填） | 本地 SSH 私钥（`.pem`） |
| `-ServerHost` | `119.45.224.68` | VPS 公网 IP |
| `-SshUser` | `ubuntu`（脚本默认） | 当前腾讯测试 VPS 请用 **`root`** |
| `-Port` | `8080` | 游戏 HTTP 端口（重启后健康检查） |
| `-Confirm` | 关闭 | **必须**传入才会执行；省略则中止且不改动 |

若你更偏好分步安装，或后续要用域名配置 HTTPS，下文手动步骤仍然有效。

## 在 VPS 上安装

```bash
sudo mkdir -p /opt/text-idle /var/lib/text-idle
sudo cp dist/text-idle /opt/text-idle/
sudo chmod +x /opt/text-idle/text-idle
```

若在本地构建，用 `scp` 上传二进制：

```bash
scp dist/text-idle user@your-vps:/tmp/
ssh user@your-vps 'sudo mv /tmp/text-idle /opt/text-idle/ && sudo chmod +x /opt/text-idle/text-idle'
```

## systemd 服务

创建 `/etc/systemd/system/text-idle.service`：

```ini
[Unit]
Description=Text Idle game server
After=network.target

[Service]
Type=simple
User=www-data
Group=www-data
WorkingDirectory=/var/lib/text-idle
Environment=PORT=8080
ExecStart=/opt/text-idle/text-idle -db /var/lib/text-idle/text-idle.db
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo chown -R www-data:www-data /var/lib/text-idle
sudo systemctl daemon-reload
sudo systemctl enable --now text-idle
sudo systemctl status text-idle
```

**监听地址**

| 方式 | 示例 |
|--------|---------|
| `PORT` 环境变量 | `Environment=PORT=8080` |
| `LISTEN_ADDR` 环境变量 | `Environment=LISTEN_ADDR=:8080` |
| CLI 参数 | `ExecStart=... -addr :8080 -db ...` |

健康检查：`curl -s -o /dev/null -w "%{http_code}" http://127.0.0.1:8080/health` 应返回 `200`。

## 使用 Caddy 配置 HTTPS

在 VPS 上安装 [Caddy](https://caddyserver.com/docs/install)。

`/etc/caddy/Caddyfile`：

```caddy
your.domain.com {
    reverse_proxy 127.0.0.1:8080
}
```

```bash
sudo systemctl reload caddy
```

分享给朋友：`https://your.domain.com/register`

## 数据持久化

- SQLite 文件：`/var/lib/text-idle/text-idle.db`（账号、存档、排行榜、留言板）
- 升级二进制时**不要**删除该目录；仅替换 `/opt/text-idle/text-idle`
- 升级前备份：

```bash
bash scripts/backup-db.sh /var/lib/text-idle/text-idle.db /var/backups/text-idle
```

可选的每日 cron（以 root 运行）：

```cron
0 3 * * * /opt/text-idle/backup-db.sh /var/lib/text-idle/text-idle.db /var/backups/text-idle
```

将 `scripts/backup-db.sh` 复制到服务器 `/opt/text-idle/`。

## 更新

1. 在本地构建新二进制
2. `sudo systemctl stop text-idle`
3. 备份数据库（见上文）
4. 替换 `/opt/text-idle/text-idle`
5. `sudo systemctl start text-idle`

启动时服务器会运行 GORM 迁移，并从现有存档回填排行榜条目。

## 内部测试说明

- 注册仅需邮箱 + 密码（MVP 无邮箱验证）
- 忘记密码：MVP 不支持；请注册新账号或手动改数据库
- 请勿公开 URL；直接邀请朋友
- 监控：systemd 日志（`journalctl -u text-idle -f`）、磁盘空间、备份文件

## 可选：Docker（MVP 非必需）

若后续想用容器：

1. 多阶段 `Dockerfile`：构建前端 + `go build -tags release`
2. 挂载卷 `/data`，使用 `-db /data/text-idle.db`
3. 前面加 Caddy 或其他反向代理做 TLS

MVP 仓库未附带此方案；最快内部测试请用上文 systemd 路径。

## 运行时（单进程）

发布版二进制在**同一进程**中运行 **HTTP + 战斗调度器**：

- **战斗调度器**：1 秒 ticker（可用 `COMBAT_TICK_INTERVAL_MS` 覆盖），工作池（`COMBAT_WORKER_COUNT`，默认 4），SQLite 每轮批量 `LIMIT 50` 到期用户。
- **重启**：调度器从 `next_tick_at` 恢复 WallClock 到期用户；卡住的 client-gated 行在启动回填时迁移到 WallClock；收益受 `offline_cap_until` 上限（见 [design/15-server-combat-tick.md](./design/15-server-combat-tick.md)）。
- **E2E / 测试库**：当 `-db` 路径包含 `e2e.db` 时，自动启用 debug tick 端点与更快的调度间隔。

## 故障排查

| 问题 | 检查项 |
|-------|--------|
| 每次刷新页面都很慢 | 发布版对内嵌静态资源启用 **gzip**（JS/CSS/HTML）和 **Cache-Control**（带 hash 的 `/assets/*` 长缓存，`/fonts/` 与 `/audio/` 7 天）。首次访问仍会下载字体（约 1.5 MB）和 JS；SFX 预加载在**首次点击/按键**时开始，而非页面加载时。部署前移除无用资源（`npm run build:dist` 仅复制 `frontend/dist`）。 |
| 部署后白屏 | Gin `NoRoute` 默认 HTTP **404**；SPA 静态处理器必须在写入 gzip/HTML/JS 前设置 **200**。若 Network 里 `/` 或 `/assets/*.js` 返回 404，需用包含 `serveSPA` 中 `c.Status(http.StatusOK)` 的修复重新构建并部署，然后硬刷新（`Ctrl+Shift+R`）清除缓存的 404 `index.html`。 |
| 部署脚本刚开始上传就 `Permission denied (publickey)` | 用 **PowerShell 直接**运行并给 `-KeyPath` 加引号（不要用 `npm run deploy:tencent -- -KeyPath ...`）。本 VPS 使用 **`-SshUser root`**。确认 `.pem` 与腾讯云控制台实例密钥一致 |
| `UNPROTECTED PRIVATE KEY FILE` / `bad permissions`（Windows） | 将 `.pem` ACL 限制为仅当前用户（PowerShell）：`icacls "D:\docs\tencent cloud key\reason515.pem" /inheritance:r; icacls "D:\docs\tencent cloud key\reason515.pem" /grant:r "$($env:USERNAME):(R)"; icacls "D:\docs\tencent cloud key\reason515.pem" /remove "Authenticated Users"; icacls "D:\docs\tencent cloud key\reason515.pem" /remove "Users"` |
| SSH 挂起 / 超时 | 安全组入站 **22**；实例运行中；公网 IP 正确 |
| Caddy 返回 502 | `systemctl status text-idle`，8080 端口是否在监听 |
| 排行榜为空 | 玩家需累计探索步数 >= 1000（`leaderboardTrack.lifetimeSteps`） |
| 重启后存档丢失 | 数据库路径须在持久卷上，勿放在临时目录 `/tmp` |
| 数据库权限错误 | `chown www-data:www-data /var/lib/text-idle` |
| 需要清空生产库 | 使用[重置生产数据](#reset-production-data-wipe-all-players)；先确认 `/var/backups/text-idle` 下有备份 |
