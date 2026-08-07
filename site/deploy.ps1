# Deploy Hexo site to Test Cloud Server
# Usage: .\site\deploy.ps1

$server = "root@120.24.114.13"
$remoteSite = "/opt/argo-website"
$remoteWebroot = "/var/www/test.derekworkspacev5.com"

Write-Host "==> Installing dependencies..." -ForegroundColor Cyan
Push-Location $PSScriptRoot
npm install

Write-Host "==> Generating static site..." -ForegroundColor Cyan
npx hexo clean
npx hexo generate

Write-Host "==> Deploying to $server ..." -ForegroundColor Cyan
ssh $server "rm -rf $remoteWebroot/*"
scp -r public/* ${server}:${remoteWebroot}/

Write-Host "==> Verifying..." -ForegroundColor Cyan
$code = ssh $server "curl -s -o /dev/null -w '%{http_code}' http://localhost/ -H 'Host: test.derekworkspacev5.com'"
if ($code -eq "200") {
    Write-Host "Deploy OK - http://120.24.114.13" -ForegroundColor Green
} else {
    Write-Host "Deploy may have issues (HTTP $code)" -ForegroundColor Yellow
}
Pop-Location
