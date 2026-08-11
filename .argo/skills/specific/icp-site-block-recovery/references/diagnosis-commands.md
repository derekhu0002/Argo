# 诊断命令集（Diagnosis Commands）

> 用于分层定位"网站无法访问"。按 阶段2/阶段3 顺序执行。命令在 Windows PowerShell 下验证；服务器端命令通过 SSH（Windows 用 plink，Linux 直接 ssh）执行。

## 1. DNS 解析（A 层）

```powershell
# 解析结果若是 Cloudflare IP（104.21.x / 172.67.x / 2606:4700:...）说明域名走了 Cloudflare 代理
Resolve-DnsName argo.example.com
Resolve-DnsName test.example.com   # 对照组
```

## 2. CDN 层行为（B 层）

```powershell
# 经域名访问，记录状态码
curl.exe -s -L -o NUL -w "HTTP_CODE=%{http_code} FINAL=%{url_effective}`n" --max-time 30 https://argo.example.com/
curl.exe -s -L -o NUL -w "HTTP_CODE=%{http_code}`n" --max-time 30 http://argo.example.com/
```

**状态码解读**：
- `525` → Cloudflare 与源站 **TLS 握手失败**（回源被重置/拒绝）
- `403` → 被拦截（需看响应头/正文区分：Cloudflare 403 vs Aliyun Beaver 403）
- `522/523/524` → 源站连不上/超时
- `200` → 该层正常，问题在别处

## 3. 源站 TCP 可达性（C 层）

```powershell
Test-NetConnection 120.24.114.13 -Port 80 -WarningAction SilentlyContinue | Select-Object RemotePort,TcpTestSucceeded
Test-NetConnection 120.24.114.13 -Port 443 -WarningAction SilentlyContinue | Select-Object RemotePort,TcpTestSucceeded
```

## 4. 源站直连（绕过 CDN，C 层）

```powershell
# HTTP 直连，带/不带 Host 对比（重点：有无 Host 结果是否不同）
curl.exe -sv --max-time 15 http://<源站IP>/ -H "Host: argo.example.com" 2>&1 | Select-String "HTTP/|Server|< |403|200"
curl.exe -s -o NUL -w "HTTP_CODE=%{http_code}`n" --max-time 15 http://<源站IP>/          # 无 Host
```

```powershell
# HTTPS 直连：无 SNI（Windows curl 连 IP 时不发 SNI）
curl.exe -sk -o NUL -w "HTTP_CODE=%{http_code}`n" --max-time 15 https://<源站IP>/
```

## 5. TLS 带 SNI 测试（关键：模拟 Cloudflare 回源）

> Cloudflare 回源**必发 SNI**；Windows curl 连 IP 时不发 SNI。因此要用带 SNI 的客户端测试。

```powershell
# .NET SslStream 带 SNI 测试（PowerShell 5.1，SslStream 在 System.dll，无需 Add-Type）
function Test-Tls($ip,$hostname,$port){
  $tcp=New-Object System.Net.Sockets.TcpClient
  try{
    $tcp.Connect($ip,$port)
    $ssl=New-Object System.Net.Security.SslStream($tcp.GetStream(),$false,{param($s,$c,$ch,$e) return $true})
    try{ $ssl.AuthenticateAsClient($hostname); Write-Host "[SNI=$hostname] TLS OK Protocol=$($ssl.SslProtocol)" }
    catch{ Write-Host "[SNI=$hostname] TLS FAILED: $($_.Exception.InnerException.Message)" }
    $ssl.Dispose()
  }catch{ Write-Host "[SNI=$hostname] TCP FAILED: $($_.Exception.Message)" }
  $tcp.Close()
}
Test-Tls '<源站IP>' 'argo.example.com' 443      # 匹配 server_name → 预期被重置
Test-Tls '<源站IP>' 'nonsense.invalid' 443      # 不匹配 → 命中默认 server → 预期 OK
```

**判读**：`SNI=真实域名` 失败、`SNI=不匹配域名` 成功、无 SNI 成功 → **按域名/S NI 维度拦截**。

## 6. 服务器本机对照（C 层，排除源站配置问题）

通过 SSH 登入源站，在 localhost / 自身公网 IP 上重复测试。若本机**全部正常**，则源站 nginx/证书/内容没问题，故障在**公网入站路径**。

```bash
# 本机回环 TLS（带 SNI）
echo | timeout 8 openssl s_client -connect 127.0.0.1:443 -servername argo.example.com -tls1_3 2>&1 | grep -E 'CONNECTED|Cipher|error|subject'
# 本机 HTTP
curl -s -o /dev/null -w '%{http_code}\n' http://localhost/ -H 'Host: argo.example.com'
# nginx 配置与证书自检
nginx -t
openssl x509 -in <cert> -noout -modulus | openssl md5     # 证书 modulus
openssl rsa -in <key> -noout -modulus | openssl md5       # 密钥 modulus（两者应一致）
# 握手错误日志（bad key share / bad extension = 被拦/扫描流量的特征）
tail -n 20 /var/log/nginx/error.log
```

## 7. ICP 拦截判定清单（全部满足 → 判定阿里云备案拦截）

| # | 检查 | 拦截特征 |
|---|---|---|
| 1 | 外网 `:80` + Host=域名 | `403`，`Server: Beaver`，正文含 **"Non-compliance ICP Filing"**（跳 `aliyun.com/beian/beian-block`）|
| 2 | 外网 `:443`/任意端口 + SNI=域名 | TLS 连接被强制重置 |
| 3 | 无 Host / 无 SNI | 放行，200 |
| 4 | 服务器本机（localhost/自身公网 IP）| 全部正常 |
| 5 | nginx 配置/证书 | `nginx -t` 通过、cert/key modulus 匹配、本机带 SNI 握手成功 |

> 抓取 403 正文确认备案提示：
> `curl.exe -s --max-time 15 http://<源站IP>/ -H "Host: argo.example.com"`

## 8. 临时诊断改动（可逆）

如需验证"非标准端口是否被拦"：临时加一个监听（如 8443），测完即删。

```bash
# 服务器端临时配置（base64 方式写避免引号问题）
cat > /etc/nginx/conf.d/port-test.conf <<'EOF'
server {
  listen 8443 ssl;
  server_name argo.example.com;
  ssl_certificate /etc/nginx/ssl/selfsigned.crt;
  ssl_certificate_key /etc/nginx/ssl/selfsigned.key;
  root /var/www/site;
  index index.html;
  location / { try_files $uri $uri/ =404; }
}
EOF
nginx -t && nginx -s reload
# 测试后必须清理还原
rm -f /etc/nginx/conf.d/port-test.conf && nginx -s reload
```

> 已实测：带该域名 SNI 的 TLS 在 8443 也被重置 → **端口绕过无效**，不必在 D 方案上浪费精力。
