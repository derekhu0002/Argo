"""
Bundle .argo and .cursor text files into one Markdown document.

Usage:
    python pack_argo_cursor_to_md.py
    python pack_argo_cursor_to_md.py -o argo_cursor_bundle.md
"""

import argparse
import dataclasses
import pathlib


WORKSPACE_ROOT = pathlib.Path(__file__).resolve().parent
DEFAULT_OUTPUT = "argo_cursor_bundle.md"
SOURCE_DIRS = (".argo", ".cursor")

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

LANGUAGE_BY_EXTENSION = {
    ".js": "javascript",
    ".json": "json",
    ".jsonc": "jsonc",
    ".md": "markdown",
    ".py": "python",
    ".ts": "typescript",
    ".tsx": "tsx",
    ".jsx": "jsx",
    ".yml": "yaml",
    ".yaml": "yaml",
    ".toml": "toml",
    ".xml": "xml",
    ".html": "html",
    ".css": "css",
    ".sh": "bash",
    ".ps1": "powershell",
}


@dataclasses.dataclass(frozen=True)
class FileEntry:
    relative_path: str
    content: str


@dataclasses.dataclass(frozen=True)
class SkippedFile:
    relative_path: str
    reason: str


@dataclasses.dataclass(frozen=True)
class BundleResult:
    written_count: int
    skipped_count: int


def to_posix_relative(path: pathlib.Path, root: pathlib.Path) -> str:
    return pathlib.PurePosixPath(path.relative_to(root)).as_posix()


def language_for(path: str) -> str:
    suffix = pathlib.PurePosixPath(path).suffix.lower()
    return LANGUAGE_BY_EXTENSION.get(suffix, "")


def markdown_fence(content: str, language: str) -> tuple[str, str]:
    longest_backtick_run = 0
    current = 0
    for char in content:
        if char == "`":
            current += 1
            longest_backtick_run = max(longest_backtick_run, current)
        else:
            current = 0

    fence = "`" * max(3, longest_backtick_run + 1)
    opening = f"{fence}{language}" if language else fence
    return opening, fence


def collect_source_files(root: pathlib.Path, output_path: pathlib.Path) -> tuple[list[FileEntry], list[SkippedFile]]:
    entries: list[FileEntry] = []
    skipped: list[SkippedFile] = []
    output_path = output_path.resolve()

    for source_dir in SOURCE_DIRS:
        source_root = root / source_dir
        if not source_root.exists():
            skipped.append(SkippedFile(source_dir, "source directory not found"))
            continue

        for path in sorted(source_root.rglob("*")):
            if not path.is_file():
                continue
            if path.resolve() == output_path:
                continue

            relative_path = to_posix_relative(path, root)
            if path.suffix.lower() in BINARY_EXTENSIONS:
                skipped.append(SkippedFile(relative_path, "binary extension"))
                continue

            try:
                content = path.read_text(encoding="utf-8")
            except UnicodeDecodeError:
                skipped.append(SkippedFile(relative_path, "not valid UTF-8 text"))
                continue
            except PermissionError:
                skipped.append(SkippedFile(relative_path, "permission denied"))
                continue

            entries.append(FileEntry(relative_path, content))

    return entries, skipped


def render_markdown(entries: list[FileEntry], skipped: list[SkippedFile]) -> str:
    lines: list[str] = [
        "# ARGO and Cursor Bundle",
        "",
        f"Generated from `{', '.join(SOURCE_DIRS)}`.",
        "",
        "## File Index",
        "",
    ]

    for entry in entries:
        lines.append(f"- `{entry.relative_path}`")

    if skipped:
        lines.extend(["", "## Skipped Files", ""])
        for item in skipped:
            lines.append(f"- `{item.relative_path}`: {item.reason}")

    lines.extend(["", "## File Contents", ""])

    for entry in entries:
        language = language_for(entry.relative_path)
        opening_fence, closing_fence = markdown_fence(entry.content, language)
        lines.extend([
            f"### `{entry.relative_path}`",
            "",
            opening_fence,
            entry.content.rstrip("\n"),
            closing_fence,
            "",
        ])

    return "\n".join(lines).rstrip() + "\n"


def write_markdown_bundle(root: pathlib.Path, output_path: pathlib.Path) -> BundleResult:
    root = root.resolve()
    output_path = output_path.resolve()
    entries, skipped = collect_source_files(root, output_path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    output_path.write_text(render_markdown(entries, skipped), encoding="utf-8")
    return BundleResult(written_count=len(entries), skipped_count=len(skipped))


def main() -> None:
    parser = argparse.ArgumentParser(description="Bundle .argo and .cursor text files into Markdown.")
    parser.add_argument(
        "-o", "--output",
        default=DEFAULT_OUTPUT,
        help=f"Output Markdown path (default: {DEFAULT_OUTPUT})",
    )
    args = parser.parse_args()

    output_path = pathlib.Path(args.output)
    if not output_path.is_absolute():
        output_path = WORKSPACE_ROOT / output_path

    result = write_markdown_bundle(WORKSPACE_ROOT, output_path)
    print(f"Wrote {result.written_count} file(s) to {output_path}")
    if result.skipped_count:
        print(f"Skipped {result.skipped_count} binary or unreadable file(s); see the Markdown report.")


if __name__ == "__main__":
    main()
