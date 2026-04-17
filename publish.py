"""
Argo VS Code Extension — Build & Publish Script

Usage:
    python publish.py package          # Only package into .vsix
    python publish.py publish           # Package + publish to VS Code Marketplace
    python publish.py publish --pre     # Publish as pre-release
    python publish.py publish --pat TOKEN  # Provide PAT inline (otherwise reads VSCE_PAT env var)
"""

import argparse
import os
import subprocess
import sys
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
PACKAGE_JSON = ROOT / "package.json"
IS_WINDOWS = sys.platform == "win32"

# On Windows, npm/npx must be invoked as .cmd
NPX = "npx.cmd" if IS_WINDOWS else "npx"
NPM = "npm.cmd" if IS_WINDOWS else "npm"


def run(cmd: list[str], *, check: bool = True, env: dict[str, str] | None = None) -> subprocess.CompletedProcess[str]:
    """Run a command, print it, and return the result."""
    print(f"\n> {' '.join(cmd)}")
    merged_env = {**os.environ, **(env or {})}
    return subprocess.run(cmd, cwd=str(ROOT), check=check, env=merged_env)


def ensure_vsce() -> str:
    """Ensure @vscode/vsce is available, return the executable path."""
    # Check if vsce is globally available
    result = subprocess.run(
        [NPX, "--yes", "@vscode/vsce", "--version"],
        capture_output=True, text=True, cwd=str(ROOT),
    )
    if result.returncode == 0:
        print(f"vsce version: {result.stdout.strip()}")
        return NPX
    print("Installing @vscode/vsce ...")
    run([NPM, "install", "--save-dev", "@vscode/vsce"])
    return NPX


def read_version() -> str:
    """Read the current version from package.json."""
    pkg = json.loads(PACKAGE_JSON.read_text(encoding="utf-8"))
    return pkg["version"]


def preflight_checks() -> None:
    """Validate the project is ready to publish."""
    pkg = json.loads(PACKAGE_JSON.read_text(encoding="utf-8"))

    errors: list[str] = []

    if not pkg.get("publisher"):
        errors.append("'publisher' is missing in package.json")

    if not pkg.get("repository"):
        print("WARNING: 'repository' field is missing in package.json (recommended but not required)")

    if not pkg.get("license"):
        print("WARNING: 'license' field is missing in package.json (recommended)")

    if not (ROOT / "README.md").exists():
        print("WARNING: README.md not found — Marketplace listing will be blank")

    if not (ROOT / "CHANGELOG.md").exists():
        print("WARNING: CHANGELOG.md not found (recommended)")

    if not (ROOT / "out" / "extension.js").exists():
        errors.append("out/extension.js not found — did you run 'npm run compile'?")

    if errors:
        print("\n❌ Pre-flight check failed:")
        for e in errors:
            print(f"   • {e}")
        sys.exit(1)

    print("✅ Pre-flight checks passed")


def npm_install() -> None:
    """Ensure dependencies are installed."""
    if not (ROOT / "node_modules").exists():
        print("node_modules not found, running npm install ...")
        run([NPM, "install"])


def compile_ts() -> None:
    """Compile TypeScript source."""
    print("\nCompiling TypeScript ...")
    run([NPM, "run", "compile"])


def package_vsix(pre_release: bool = False) -> pathlib.Path:
    """Package the extension into a .vsix file."""
    version = read_version()
    cmd = [NPX, "@vscode/vsce", "package",
          "--allow-missing-repository", "--allow-star-activation"]
    if pre_release:
        cmd.append("--pre-release")

    run(cmd)

    # Find the generated .vsix file
    vsix_files = sorted(ROOT.glob("*.vsix"), key=lambda p: p.stat().st_mtime, reverse=True)
    if not vsix_files:
        print("❌ No .vsix file found after packaging")
        sys.exit(1)

    vsix = vsix_files[0]
    size_kb = vsix.stat().st_size / 1024
    print(f"\n📦 Packaged: {vsix.name} ({size_kb:.1f} KB)")
    return vsix


def publish_extension(pat: str | None = None, pre_release: bool = False) -> None:
    """Publish the extension to the VS Code Marketplace."""
    token = pat or os.environ.get("VSCE_PAT")
    if not token:
        print(
            "❌ No Personal Access Token provided.\n"
            "   Set the VSCE_PAT environment variable or pass --pat TOKEN.\n"
            "   Create a PAT at: https://dev.azure.com → User Settings → Personal Access Tokens\n"
            "   Required scope: Marketplace > Manage"
        )
        sys.exit(1)

    cmd = [NPX, "@vscode/vsce", "publish",
          "--allow-missing-repository", "--allow-star-activation"]
    if pre_release:
        cmd.append("--pre-release")

    run(cmd, env={"VSCE_PAT": token})

    version = read_version()
    print(f"\n🚀 Published argo-architect@{version} to VS Code Marketplace")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build & publish the Argo VS Code extension.")
    sub = parser.add_subparsers(dest="action", required=True)

    # package sub-command
    pkg_parser = sub.add_parser("package", help="Package into .vsix only")
    pkg_parser.add_argument("--pre", action="store_true", help="Mark as pre-release")

    # publish sub-command
    pub_parser = sub.add_parser("publish", help="Package and publish to Marketplace")
    pub_parser.add_argument("--pre", action="store_true", help="Publish as pre-release")
    pub_parser.add_argument("--pat", type=str, default=None, help="VS Marketplace Personal Access Token")

    args = parser.parse_args()

    # Common steps
    npm_install()
    ensure_vsce()
    compile_ts()
    preflight_checks()

    if args.action == "package":
        vsix = package_vsix(pre_release=args.pre)
        print(f"\nDone. Install locally with:\n  code --install-extension {vsix.name}")

    elif args.action == "publish":
        package_vsix(pre_release=args.pre)
        publish_extension(pat=args.pat, pre_release=args.pre)


if __name__ == "__main__":
    main()
