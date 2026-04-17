"""
Argo VS Code Extension — Build & Publish Script

Usage:
    python publish.py                    # Auto-bump patch version and publish
    python publish.py package            # Package into build/<name>-<version>.vsix
    python publish.py publish            # Auto-bump patch version and publish
    python publish.py publish --version 0.2.0
    python publish.py package --version 0.2.0
"""

import argparse
import os
import subprocess
import sys
import json
import pathlib

ROOT = pathlib.Path(__file__).resolve().parent
PACKAGE_JSON = ROOT / "package.json"
BUILD_DIR = ROOT / "build"
IS_WINDOWS = sys.platform == "win32"

# On Windows, npm/npx must be invoked as .cmd
NPX = "npx.cmd" if IS_WINDOWS else "npx"
NPM = "npm.cmd" if IS_WINDOWS else "npm"


def read_package_json() -> dict:
    """Read package.json as a dictionary."""
    return json.loads(PACKAGE_JSON.read_text(encoding="utf-8"))


def write_package_json(pkg: dict) -> None:
    """Write package.json with stable formatting."""
    PACKAGE_JSON.write_text(json.dumps(pkg, indent=2) + "\n", encoding="utf-8")


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
    pkg = read_package_json()
    return pkg["version"]


def read_extension_name() -> str:
    """Read the extension package name from package.json."""
    pkg = read_package_json()
    return pkg["name"]


def validate_version(version: str) -> None:
    """Validate a semver version string."""
    parts = version.split(".")
    if len(parts) != 3 or not all(part.isdigit() for part in parts):
        print(f"❌ Invalid version: {version}")
        print("   Expected format: MAJOR.MINOR.PATCH, for example 0.2.0")
        sys.exit(1)


def bump_patch_version(version: str) -> str:
    """Return the next patch version."""
    validate_version(version)
    major, minor, patch = (int(part) for part in version.split("."))
    return f"{major}.{minor}.{patch + 1}"


def update_version(version: str) -> None:
    """Update package.json version in place."""
    pkg = read_package_json()
    current = pkg["version"]
    if current == version:
        print(f"ℹ️ Version unchanged: {version}")
        return

    pkg["version"] = version
    write_package_json(pkg)
    print(f"🔖 Version updated: {current} -> {version}")


def resolve_target_version(action: str, requested_version: str | None) -> str:
    """Resolve the version to use for this run."""
    current = read_version()

    if requested_version:
        validate_version(requested_version)
        return requested_version

    if action == "publish":
        return bump_patch_version(current)

    return current


def ensure_build_dir() -> pathlib.Path:
    """Ensure the build output directory exists."""
    BUILD_DIR.mkdir(exist_ok=True)
    return BUILD_DIR


def build_vsix_path(version: str) -> pathlib.Path:
    """Return the target VSIX path under build/."""
    name = read_extension_name()
    return ensure_build_dir() / f"{name}-{version}.vsix"


def preflight_checks() -> None:
    """Validate the project is ready to publish."""
    pkg = read_package_json()

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


def package_vsix(version: str, pre_release: bool = False) -> pathlib.Path:
    """Package the extension into a .vsix file."""
    vsix = build_vsix_path(version)
    if vsix.exists():
        vsix.unlink()

    cmd = [NPX, "@vscode/vsce", "package",
          "--allow-missing-repository", "--allow-star-activation",
          "--skip-license", "--out", str(vsix)]
    if pre_release:
        cmd.append("--pre-release")

    run(cmd)

    if not vsix.exists():
        print(f"❌ No .vsix file found after packaging: {vsix}")
        sys.exit(1)

    size_kb = vsix.stat().st_size / 1024
    print(f"\n📦 Packaged: {vsix} ({size_kb:.1f} KB)")
    return vsix


def publish_extension(vsix: pathlib.Path, pat: str | None = None, pre_release: bool = False) -> None:
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
        "--allow-missing-repository", "--allow-star-activation",
        "--skip-license", "--packagePath", str(vsix)]
    if pre_release:
        cmd.append("--pre-release")

    run(cmd, env={"VSCE_PAT": token})

    version = read_version()
    print(f"\n🚀 Published argo-architect@{version} to VS Code Marketplace")


def main() -> None:
    parser = argparse.ArgumentParser(description="Build & publish the Argo VS Code extension.")
    parser.add_argument(
        "action",
        nargs="?",
        choices=("package", "publish"),
        default="publish",
        help="package: build VSIX only; publish: auto-bump patch version and publish (default)",
    )
    parser.add_argument("--pre", action="store_true", help="Mark as pre-release")
    parser.add_argument("--pat", type=str, default=None, help="VS Marketplace Personal Access Token")
    parser.add_argument("--version", type=str, default=None, help="Explicit version to write to package.json before packaging/publishing")

    args = parser.parse_args()

    # Common steps
    npm_install()
    ensure_vsce()

    target_version = resolve_target_version(args.action, args.version)
    update_version(target_version)

    compile_ts()
    preflight_checks()

    if args.action == "package":
        vsix = package_vsix(target_version, pre_release=args.pre)
        print(f"\nDone. Install locally with:\n  code --install-extension {vsix}")

    elif args.action == "publish":
        vsix = package_vsix(target_version, pre_release=args.pre)
        publish_extension(vsix, pat=args.pat, pre_release=args.pre)


if __name__ == "__main__":
    main()
