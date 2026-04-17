"""
Pack all workspace files (excluding .gitignore patterns) into a single JSON file.

Usage:
    python pack_workspace.py              # outputs workspace_bundle.json
    python pack_workspace.py -o out.json  # custom output path
"""

import json
import pathlib
import argparse
import fnmatch
import sys

WORKSPACE_ROOT = pathlib.Path(__file__).resolve().parent


def parse_gitignore(root: pathlib.Path) -> list[str]:
    """Read .gitignore and return a list of patterns."""
    gitignore = root / ".gitignore"
    if not gitignore.exists():
        return []
    patterns: list[str] = []
    for line in gitignore.read_text(encoding="utf-8").splitlines():
        line = line.strip()
        if not line or line.startswith("#"):
            continue
        patterns.append(line)
    return patterns


def is_ignored(rel_path: pathlib.PurePosixPath, patterns: list[str]) -> bool:
    """Check whether a relative path matches any .gitignore pattern."""
    rel_str = str(rel_path)
    for pattern in patterns:
        clean = pattern.rstrip("/")
        # Directory pattern (trailing /)
        if pattern.endswith("/"):
            # Match if any path component starts with this dir name
            for part_idx, _part in enumerate(rel_path.parts):
                partial = "/".join(rel_path.parts[: part_idx + 1])
                if fnmatch.fnmatch(partial, clean) or fnmatch.fnmatch(partial + "/", pattern):
                    return True
        # File glob pattern
        if fnmatch.fnmatch(rel_str, pattern) or fnmatch.fnmatch(rel_str, f"**/{pattern}"):
            return True
        # Also check each path component against the pattern
        for part_idx in range(len(rel_path.parts)):
            partial = "/".join(rel_path.parts[: part_idx + 1])
            if fnmatch.fnmatch(partial, clean):
                return True
    return False


# Files that should always be skipped regardless of .gitignore
ALWAYS_SKIP = {".git"}

# Binary extensions that we skip to keep the JSON clean
BINARY_EXTENSIONS = {
    ".png", ".jpg", ".jpeg", ".gif", ".bmp", ".ico", ".webp",
    ".woff", ".woff2", ".ttf", ".eot", ".otf",
    ".zip", ".tar", ".gz", ".7z", ".rar",
    ".exe", ".dll", ".so", ".dylib",
    ".pdf", ".doc", ".docx", ".xls", ".xlsx",
    ".mp3", ".mp4", ".avi", ".mov", ".wav",
    ".pyc", ".pyo", ".class", ".o", ".obj",
    ".vsix",
}


def collect_files(root: pathlib.Path, patterns: list[str]) -> dict[str, str]:
    """Walk the workspace and return {relative_path: file_content}."""
    bundle: dict[str, str] = {}

    for path in sorted(root.rglob("*")):
        if not path.is_file():
            continue

        rel = path.relative_to(root)
        rel_posix = pathlib.PurePosixPath(rel)

        # Skip .git directory
        if any(part in ALWAYS_SKIP for part in rel_posix.parts):
            continue

        # Skip gitignored paths
        if is_ignored(rel_posix, patterns):
            continue

        # Skip the output bundle itself and this script
        if path.suffix in BINARY_EXTENSIONS:
            continue

        try:
            content = path.read_text(encoding="utf-8")
        except (UnicodeDecodeError, PermissionError):
            continue  # skip unreadable / binary files

        bundle[str(rel_posix)] = content

    return bundle


def main() -> None:
    parser = argparse.ArgumentParser(description="Pack workspace files into JSON.")
    parser.add_argument(
        "-o", "--output",
        default="workspace_bundle.json",
        help="Output JSON file path (default: workspace_bundle.json)",
    )
    args = parser.parse_args()

    output_path = (WORKSPACE_ROOT / args.output).resolve()

    patterns = parse_gitignore(WORKSPACE_ROOT)
    # Also ignore the output file itself
    try:
        output_rel = str(pathlib.PurePosixPath(output_path.relative_to(WORKSPACE_ROOT)))
        patterns.append(output_rel)
    except ValueError:
        pass

    bundle = collect_files(WORKSPACE_ROOT, patterns)

    output_path.write_text(
        json.dumps(bundle, indent=2, ensure_ascii=False),
        encoding="utf-8",
    )

    print(f"Packed {len(bundle)} file(s) into {output_path}")
    for fp in bundle:
        print(f"  {fp}")


if __name__ == "__main__":
    main()
