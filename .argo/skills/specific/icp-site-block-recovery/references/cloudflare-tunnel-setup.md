# Cloudflare Tunnel 部署（绕过 ICP 备案拦截）

> 目标：源站 `cloudflared` **出站**连接 Cloudflare，将 `域名 → http://localhost:80` 路由进隧道，绕开阿里云对公网入站 80/443 的备案拦截。
> 前置：Cloudflare 账号 + API token（含 Account→Cloudflare Tunnel→Edit；若需自动改 DNS 还需 Zone→DNS→Edit）。

## 1. 验证 token（账号级格式）

```powershell
$env:CF_TOKEN='cfat_xxx'   # cfat_ 是账号级格式
$env:CF_ACCOUNT='<account-id>'
# 注意：用账号级端点，/user/tokens/verify 对 cfat_ 会报 Invalid API Token
curl.exe -s -X GET "https://api.cloudflare.com/client/v4/accounts/$env:CF_ACCOUNT/tokens/verify" -H "Authorization: Bearer $env:CF_TOKEN"
# 获取账号与 zone
curl.exe -s -X GET "https://api.cloudflare.com/client/v4/accounts" -H "Authorization: Bearer $env:CF_TOKEN"
curl.exe -s -X GET "https://api.cloudflare.com/client/v4/zones?name=example.com" -H "Authorization: Bearer $env:CF_TOKEN"
```

> 经验：R2 页面创建的 token 有隧道权限但**缺 Zone DNS 权限**（DNS 接口返回 403）。DNS 变更需用户控制台操作，或另配含 DNS Edit 的 token。

## 2. 创建隧道（PowerShell + Invoke-RestMethod）

```powershell
$h = @{ Authorization = "Bearer $env:CF_TOKEN" }
$body = @{ name='site-origin'; config_src='cloudflare' } | ConvertTo-Json
$r = Invoke-RestMethod -Method Post -Uri "https://api.cloudflare.com/client/v4/accounts/$env:CF_ACCOUNT/cfd_tunnel" -Headers $h -Body $body -ContentType 'application/json'
$r.result | ConvertTo-Json -Depth 6
# 记录 tunnel_id、credentials_file(TunnelSecret)、token(JWT)
```

## 3. 配置隧道路由（ingress）

```powershell
$env:TUNNEL='<tunnel-id>'
$cfg = @{ config = @{ ingress = @(
  @{ hostname='argo.example.com'; service='http://localhost:80' },
  @{ service='http_status:404' }   # 兜底
) } } | ConvertTo-Json -Depth 6
Invoke-RestMethod -Method Put -Uri "https://api.cloudflare.com/client/v4/accounts/$env:CF_ACCOUNT/cfd_tunnel/$env:TUNNEL/configurations" -Headers $h -Body $cfg -ContentType 'application/json'
```

## 4. 源站安装 cloudflared（国内 GitHub 限速）

> 直连 GitHub releases 被限速（~15-30KB/s）。**aria2 多线程**（每连接独立限速，可叠加）最有效；`pkg.cloudflare.com` apt 仓库当前已失效（404/302），不要依赖。

```bash
apt-get update && apt-get install -y aria2
cd /tmp && aria2c -x 8 -s 8 -k 1M -d /tmp -o cloudflared \
  "https://github.com/cloudflare/cloudflared/releases/latest/download/cloudflared-linux-amd64"
chmod +x /tmp/cloudflared && /tmp/cloudflared --version
cp /tmp/cloudflared /usr/local/bin/cloudflared
```

> 实测 8 连接从 ~17KB/s 提升到 ~127KB/s（35MB 约 4 分钟）。

## 5. 写入凭据、配置、systemd 服务

**凭据** `/etc/cloudflared/<tunnel-id>.json`（用 base64 传输避免引号问题）：

```json
{ "AccountTag": "<account-tag>", "TunnelID": "<tunnel-id>", "TunnelName": "site-origin", "TunnelSecret": "<secret>" }
```

**配置** `/etc/cloudflared/config.yml`（remote-config 隧道无需本地 ingress）：

```yaml
tunnel: <tunnel-id>
credentials-file: /etc/cloudflared/<tunnel-id>.json
```

**systemd** `/etc/systemd/system/cloudflared.service`：

```ini
[Unit]
Description=Cloudflare Tunnel (site-origin)
After=network-online.target
Wants=network-online.target

[Service]
Type=notify
ExecStart=/usr/local/bin/cloudflared --config /etc/cloudflared/config.yml tunnel run <tunnel-id>
Restart=on-failure
RestartSec=5s
LimitNOFILE=1048576

[Install]
WantedBy=multi-user.target
```

```bash
systemctl daemon-reload && systemctl enable --now cloudflared
sleep 5
systemctl status cloudflared --no-pager | head -12
```

**成功标志**（关键日志）：

```
INF Registered tunnel connection connIndex=0 connection=... ip=<cf-edge-ip> location=<edge> protocol=quic
```

> 源站通过 **QUIC 出站**连到 Cloudflare 边缘，即已绕过阿里云入站备案拦截。

## 6. DNS 指向隧道

- 有 Zone DNS 权限 → API 建 CNAME；否则用户控制台操作（推荐，30 秒）：
  - 控制台 DNS → Records → 编辑 `域名` 记录
  - Type=`CNAME`，Name=`域名`，Target=`<tunnel-id>.cfargotunnel.com`，**Proxy status=Proxied**（橙色云），TTL=Auto

> 隧道 `/cfd_tunnel/{id}/routes` 与 `/tunnels/{id}/routes` 端点已弃用（404），直接用 DNS CNAME 即可。

## 7. 验收

```powershell
# HTTPS 200 且内容正确
curl.exe -s -L -o NUL -w "HTTP_CODE=%{http_code}`n" --max-time 30 https://argo.example.com/
# 稳定性
1..5 | ForEach-Object { curl.exe -s -o NUL -w "%{http_code} " --max-time 30 https://argo.example.com/ }; Write-Host ""
# 内容渲染（浏览器验证中文/资源正常）
curl.exe -s https://argo.example.com/ | Select-String "<title>|og:title"
```

验收对照：HTTPS 200、页面标题/导航/内容正确、静态资源 200、连续 5 次 200。

## 8. 运维注意事项

- 隧道服务异常时：`systemctl status cloudflared` / `journalctl -u cloudflared -n 50`。
- 新增域名：`PUT /configurations` 加 ingress + 控制台加 CNAME。
- 安全：会话中共享过 SSH 密码/token → 建议改 SSH 密钥认证、轮换 Cloudflare token。
