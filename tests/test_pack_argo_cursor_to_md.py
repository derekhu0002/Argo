import importlib.util
import pathlib
import tempfile
import unittest


SCRIPT_PATH = pathlib.Path(__file__).resolve().parents[1] / "pack_argo_cursor_to_md.py"


def load_script_module():
    spec = importlib.util.spec_from_file_location("pack_argo_cursor_to_md", SCRIPT_PATH)
    module = importlib.util.module_from_spec(spec)
    assert spec.loader is not None
    spec.loader.exec_module(module)
    return module


class PackArgoCursorToMarkdownTests(unittest.TestCase):
    def test_writes_readable_code_and_config_files_to_markdown(self):
        module = load_script_module()

        with tempfile.TemporaryDirectory() as tmp:
            root = pathlib.Path(tmp)
            (root / ".argo" / "scripts").mkdir(parents=True)
            (root / ".argo" / "schema").mkdir(parents=True)
            (root / ".cursor" / "skills" / "sample").mkdir(parents=True)

            (root / ".argo" / "scripts" / "tool.js").write_text(
                "console.log('kept');\n",
                encoding="utf-8",
            )
            (root / ".argo" / "schema" / "config.json").write_text(
                '{"enabled": true}\n',
                encoding="utf-8",
            )
            (root / ".cursor" / "skills" / "sample" / "SKILL.md").write_text(
                "# Sample\n",
                encoding="utf-8",
            )
            (root / ".cursor" / "image.png").write_bytes(b"\x89PNG\r\n\x1a\n")

            output = root / "bundle.md"
            result = module.write_markdown_bundle(root, output)
            markdown = output.read_text(encoding="utf-8")

            self.assertEqual(result.written_count, 3)
            self.assertIn("`.argo/scripts/tool.js`", markdown)
            self.assertIn("`.argo/schema/config.json`", markdown)
            self.assertIn("`.cursor/skills/sample/SKILL.md`", markdown)
            self.assertIn("```javascript", markdown)
            self.assertIn("```json", markdown)
            self.assertIn("```markdown", markdown)
            self.assertIn("console.log('kept');", markdown)
            self.assertIn('{"enabled": true}', markdown)
            self.assertIn("Skipped Files", markdown)
            self.assertIn("`.cursor/image.png`", markdown)


if __name__ == "__main__":
    unittest.main()
