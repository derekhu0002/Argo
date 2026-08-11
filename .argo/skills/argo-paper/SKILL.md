---
name: argo-paper
description: Use when publishing or updating a Hexo Markdown article, post assets, or public technical content on the ARGO website.
---

# Publishing ARGO Articles

## Overview

Publish from `site/source/` through a verified Hexo build, a reversible remote deployment, and origin plus public HTTPS checks.

**Core principle:** a successful upload is not a publication. Publication requires correct rendered content, readable assets, a recoverable server change, and public 2xx verification.

## When to Use

Use for:

- new or updated posts under `site/source/_posts/`;
- article images under `site/source/images/`;
- deployment to `argo.derekworkspacev5.com`;
- diagnosing a post that builds locally but is missing, returns 404/403/525, or has broken images.

Do not use for application releases, intent-architecture mutations, or Graph RAG lifecycle operations.

## Publication Contract

Before starting, identify:

- post slug and expected public path;
- unique article title or body marker;
- every local asset referenced by the post;
- SSH target, currently `root@120.24.114.13`;
- Nginx `server_name` and its active `root`.

Never infer the webroot from `site/_config.yml`, `site/deploy.ps1`, an old deployment, or a test-domain directory. Read `nginx -T` and bind the exact `server_name argo.derekworkspacev5.com` block to its `root`.

## Workflow

### 1. Prepare the source

1. Place the post at `site/source/_posts/<slug>.md`.
2. Include valid Hexo frontmatter: `title`, `date`, `description`, `categories`, and `tags`.
3. Put public images in `site/source/images/` and reference them as `/images/<file>`.
4. Check technical claims against current repository evidence. State failing or unverified production boundaries explicitly.
5. Do not modify `design/KG/SystemArchitecture.json` merely to publish an article.

### 2. Build without changing dependency intent

From `site/`:

```powershell
if (Test-Path "package-lock.json") {
  npm ci
} else {
  npm install --no-package-lock
}
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run clean
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

npm run build
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
```

Require all of:

- `public/index.html`;
- `public/<year>/<month>/<day>/<slug>/index.html`;
- each referenced asset under `public/images/`;
- rendered HTML containing the expected title, evidence boundary, and acceptance section.

### 3. Establish safe SSH authentication

Use an already authorized SSH key:

```powershell
ssh -o BatchMode=yes -o ConnectTimeout=10 root@120.24.114.13 "echo SSH_KEY_READY"
```

If only a password is available, stop automation and ask the user to authorize an existing public key interactively. Never put a password in:

- shell arguments;
- scripts or temporary files;
- environment variables used by deployment commands;
- chat-visible terminal logs.

Recommend rotating any password pasted into chat.

### 4. Discover and validate the target

Read the effective configuration:

```powershell
ssh -o BatchMode=yes root@120.24.114.13 "nginx -T"
```

Confirm:

- one applicable `server_name argo.derekworkspacev5.com`;
- its exact webroot;
- the webroot and parent directory exist;
- `nginx -t` passes;
- a unique staging path and backup path do not already exist.

If any mapping is ambiguous, stop. Do not run `site/deploy.ps1` blindly: inspect its target, deletion behavior, rollback, permissions, and verification first.

### 5. Stage, verify, back up, and deploy

Use a timestamped staging directory outside the live webroot, upload the complete `public/` contents, and verify the staged article and assets before touching live files.

```powershell
$server = "root@120.24.114.13"
$stage = "/tmp/argo-site-<timestamp>"
$backup = "/tmp/argo-webroot-backup-<timestamp>"
$webroot = "<root from nginx -T>"

ssh -o BatchMode=yes $server "test ! -e '$stage' && test ! -e '$backup' && mkdir '$stage'"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

scp -o BatchMode=yes -r "public/." "${server}:${stage}/"
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }
```

Then perform one guarded remote operation:

```sh
set -e
stage="$(realpath -m -- "$stage")"
backup="$(realpath -m -- "$backup")"
webroot="$(realpath -m -- "$webroot")"
for path in "$stage" "$backup" "$webroot"; do
  case "$path" in /*) ;; *) exit 2 ;; esac
done
test "$webroot" != "/"
test "$stage" != "$backup"
test "$stage" != "$webroot"
test "$backup" != "$webroot"
case "$stage/" in "$webroot/"*) exit 2 ;; esac
case "$backup/" in "$webroot/"*) exit 2 ;; esac
case "$webroot/" in "$stage/"*) exit 2 ;; esac
case "$webroot/" in "$backup/"*) exit 2 ;; esac
case "$stage/" in "$backup/"*) exit 2 ;; esac
case "$backup/" in "$stage/"*) exit 2 ;; esac
test ! -e "$backup"
test -s "$stage/index.html"
test -s "$stage/<article-path>/index.html"
# Repeat for every asset in the source inventory:
test -s "$stage/images/<required-image>"
cp -a "$webroot" "$backup"
rsync -a --delete "$stage/" "$webroot/"
chmod -R a+rX "$webroot"
nginx -t
```

The backup must complete before `rsync --delete`. Preserve the backup until public verification succeeds.

### 6. Verify origin and public delivery

Verify the origin from the server so DNS or Cloudflare cannot hide Nginx behavior:

```sh
origin_check="/tmp/argo-origin-article-check.html"
origin_status="$(curl --silent --show-error \
  --output "$origin_check" --write-out "%{http_code}" \
  --header "Host: argo.derekworkspacev5.com" \
  "http://127.0.0.1/<article-path>/")"
case "$origin_status" in 2??) ;; *) exit 1 ;; esac
```

Then verify public HTTPS:

```powershell
$articleCheck = Join-Path $env:TEMP "argo-article-check.html"
$articleStatus = curl.exe --silent --show-error --location `
  --output $articleCheck --write-out "%{http_code}" `
  "https://argo.derekworkspacev5.com/<article-path>/"
if ($LASTEXITCODE -ne 0 -or $articleStatus -notmatch "^2\d\d$") {
  throw "Public article verification failed: HTTP $articleStatus"
}
if (-not (Select-String -Path $articleCheck -SimpleMatch "<unique-marker>" -Quiet)) {
  throw "Public article marker is missing"
}

# Repeat for every asset in the source inventory:
$assetEvidence = curl.exe --silent --show-error --location `
  --output NUL --write-out "%{http_code} %{content_type}" `
  "https://argo.derekworkspacev5.com/images/<required-image>"
if ($LASTEXITCODE -ne 0 -or $assetEvidence -notmatch "^2\d\d image/") {
  throw "Public asset verification failed: $assetEvidence"
}
```

Publication is complete only when:

- origin and public article requests return 2xx;
- rendered output contains the unique article marker;
- every referenced public image returns 2xx with an image content type;
- the homepage or archive lists the new post when expected.

### 7. Diagnose before retrying

For unexpected 403/404:

1. Verify the generated file exists in the active webroot.
2. Inspect every path component with `namei -l`.
3. Normalize read/traverse permissions with `chmod -R a+rX "$webroot"`.
4. Re-test the origin with the exact Host header.
5. If files, permissions, and on-disk Nginx config are correct but the active server is stale, run `nginx -t`, reload Nginx once, and re-test.

For Cloudflare 525 or other TLS failures, verify origin HTTPS and the Nginx certificate separately. Do not report publication complete from an origin HTTP 200 alone.

### 8. Roll back on failed verification

```sh
set -e
test -s "$backup/index.html"
test -s "$backup/<previous-known-page>/index.html"
rsync -a --delete "$backup/" "$webroot/"
chmod -R a+rX "$webroot"
nginx -t
```

Re-run origin and public checks after rollback. Keep the failed staging directory until diagnosis is complete.

## Quick Reference

| Gate | Required evidence |
|---|---|
| Source | Valid frontmatter, public asset paths, evidence-backed claims |
| Build | Hexo exits 0; article and images exist in `public/` |
| Authentication | Passwordless SSH key; no secrets in commands or logs |
| Target | Exact Nginx server block and webroot |
| Deployment | Staging verified, backup created, permissions readable |
| Server | `nginx -t` passes; reload only when justified |
| Publication | Origin and public HTTPS 2xx, article marker and images verified |
| Repository | Review `git status`; never commit unless explicitly requested |

## Common Mistakes

- Treating `scp` exit 0 as publication success.
- Guessing the live webroot from a test-domain script.
- Deleting live files before a backup exists.
- Letting Windows `scp` leave directories at mode `700`, causing Nginx 403/404.
- Running `npm install` and unintentionally creating a lock file.
- Checking only the homepage, not the article and every image.
- Treating an origin 200 as success while public HTTPS returns a Cloudflare error.
- Putting a root password in command history, process arguments, or logs.
- Committing the article or generated output without an explicit request.

## Example Completion Report

```text
Published: https://argo.derekworkspacev5.com/<article-path>/
Verified: Hexo build 0; origin 2xx; public HTTPS 2xx; unique marker present;
all inventoried article images 2xx with image/* content type; homepage/archive updated.
Rollback: /tmp/argo-webroot-backup-<timestamp>
Repository: source changes remain uncommitted.
```
