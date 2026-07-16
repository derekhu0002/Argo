---
name: window-analysis
description: Guide for analyzing HarmonyOS app UI windows — layout verification (component tree) and image verification (screenshots). Use when you need to confirm what page is displayed, verify UI component structure, check text content, or validate visual appearance on a connected HarmonyOS device/emulator.
---

# Window Analysis Skill — HarmonyOS UI 窗口分析

Use this skill when the task needs to analyze a HarmonyOS app's current UI window through either:

1. **Layout Verification** — component tree inspection via `hdc shell uitest dumpLayout`
2. **Image Verification** — screenshot capture and pixel analysis via `hdc shell snapshot_display`

## Prerequisites

- HDC (HarmonyOS Device Connector) installed and in PATH, typically at:
  `C:\Program Files\Huawei\DevEco Studio\sdk\default\openharmony\toolchains\hdc.exe`
- Target device/emulator connected (verify with `hdc list targets`)
- App bundle name known (e.g., `com.example.jetsnack`)
- Python 3.10+ with Pillow (`pip install Pillow`) for screenshot analysis

## Runtime Boundary

- Public entrypoint: `.github/skills/window-analysis/run.js`
- Companion scripts:
  - `.github/skills/window-analysis/layout-analyzer.py` — standalone layout JSON analyzer
  - `.github/skills/window-analysis/screenshot-analyzer.py` — standalone screenshot pixel analyzer
- Artifact root: project root (screenshots and layout dumps land here)
- Compatibility pointer: `work/skills/window-analysis/SKILL.md`

---

## Part A: Layout Verification (Component Tree)

Use layout verification when you need to **confirm page identity** — i.e., answer "is the current screen really the Feed page?" This is more reliable than screenshot pixel analysis because it reads actual UI component structure.

### A.1 Dump the component tree

```bash
hdc shell uitest dumpLayout -p /data/local/tmp/layout.json -b <bundleName>
hdc file recv /data/local/tmp/layout.json <localPath>
```

**Parameters:**
- `-p <savePath>` — device path for output JSON
- `-b <bundleName>` — target app bundle name
- `-m <true/false>` — merge windows (default: true)
- `-a` — include font attributes (optional)

The output is a **JSON tree** with this structure per node:

```json
{
  "attributes": {
    "pagePath": "pages/FooPage",      // which page is displayed
    "type": "Text",                    // component type: Text, Button, Column, Row, Stack, Image, etc.
    "text": "Hello World",             // visible text content
    "id": "",                          // component id if set
    "bounds": "[left,top][right,bottom]",  // pixel bounds
    "clickable": "true/false",         // interactivity
    "enabled": "true/false",
    "hint": "",                        // placeholder hint text
    "description": "",                 // accessibility description
    "accessibilityId": "",
    "hashcode": ""
  },
  "children": [ ... ]
}
```

### A.2 Key assertions you can make from the component tree

| Assertion | How | Example |
|---|---|---|
| **Page identity** | Check `text` field for page-specific strings | Feed page has "Delivery to 1600 Amphitheater Way" |
| **Page path** | Check `pagePath` attribute | `pages/JetsnackApp` vs `pages/SnackDetail` |
| **Tab labels** | Filter texts for known tab names | `["Home", "Search", "Cart", "Profile"]` |
| **Component types** | Count by `type` attribute | Feed should have Text, Column, Row, Button |
| **Component count** | Total non-root component nodes | ≥ 15 = fully rendered |
| **Clickable elements** | Check `clickable == "true"` | Tab bar items should be clickable |
| **Element bounds** | Parse `bounds` to verify layout positions | Tab bar Y-range should be ~2567-2753 |
| **Specific text presence** | Search `text` values | Cart page should have "Checkout" or similar |
| **Hint text** | Check `hint` for input fields | Search bar hint should be "Search snacks" |

### A.3 Using the layout analyzer script

```bash
python .github/skills/window-analysis/layout-analyzer.py <layout.json> [--find-text "text"] [--find-type "Type"] [--summary]
```

**Options:**
- `--summary` — print pagePath, all texts, component type counts
- `--find-text "..."` — check if specific text exists, exit 0 if found
- `--find-type "..."` — check if component type exists
- `--min-components N` — verify at least N components rendered
- `--tab-labels "Home,Search,Cart,Profile"` — verify tab labels match

**Exit codes:** 0 = pass, 1 = fail

### A.4 Agent workflow for layout verification

```
1. hdc list targets                          → confirm device connected
2. hdc shell uitest dumpLayout -p ... -b ...  → dump component tree
3. hdc file recv ...                          → pull JSON to local
4. python layout-analyzer.py ... --summary    → inspect structure
5. python layout-analyzer.py ... --find-text "..." → assert page identity
6. python layout-analyzer.py ... --min-components N → assert full render
```

---

## Part B: Image Verification (Screenshot)

Use image verification for **visual regression** — color checking, blank-screen detection, theme validation, and before/after navigation comparison. This complements layout verification.

### B.1 Capture a screenshot

```bash
hdc shell snapshot_display -f /data/local/tmp/screenshot.jpeg
hdc file recv /data/local/tmp/screenshot.jpeg <localPath>
```

**Parameters:**
- `-f <savePath>` — device path for output image
- `-d <displayId>` — display ID (default: 0)

Output is a JPEG image at the device's native resolution (e.g., 1320×2856).

### B.2 Key assertions you can make from screenshots

| Assertion | How | Threshold |
|---|---|---|
| **Not blank** | Count unique colors across sampled pixels | > 100 unique colors |
| **Region not blank** | Crop region then count unique colors | > 50 for small regions |
| **Page changed** | Compare two screenshots pixel-by-pixel | > 2% pixels differ |
| **Contains color** | Check if any pixel matches target hex ±30 tolerance | Any match |
| **Mean color** | Average RGB across region | — |
| **Dark theme** | Mean brightness < 80 | — |
| **Card image diversity** | Count unique colors in card image regions | > 30 unique (real photo) |

### B.3 Using the screenshot analyzer script

```bash
python .github/skills/window-analysis/screenshot-analyzer.py <screenshot.jpeg> [options]
```

**Options:**
- `--not-blank [threshold]` — verify screenshot has content (default threshold: 100)
- `--region L,T,R,B --not-blank [threshold]` — verify region has content
- `--diff <other.jpeg>` — verify two screenshots differ (>2% pixel change)
- `--mean-color` — print mean RGB of entire image
- `--region L,T,R,B --mean-color` — print mean RGB of region
- `--contains-color #HEX` — check if color exists in image
- `--is-dark` — check if screenshot shows dark theme (brightness < 80)
- `--card-diversity L,T,R,B` — check card region has diverse colors (>30 unique)
- `--summary` — print all checks as pass/fail

**Exit codes:** 0 = pass, 1 = fail

### B.4 Agent workflow for image verification

```
1. hdc shell snapshot_display -f ...    → capture screenshot on device
2. hdc file recv ...                    → pull to local
3. python screenshot-analyzer.py ... --not-blank          → verify content
4. python screenshot-analyzer.py ... --region ... --not-blank 50  → verify tab bar
5. python screenshot-analyzer.py ... --diff before.jpeg   → verify page changed
6. python screenshot-analyzer.py ... --is-dark            → verify dark mode
```

---

## Part C: Combined Workflow (Recommended)

For maximum confidence, use **both** layout and image analysis:

```
1. LAUNCH app
2. DUMP layout  → assert page identity (component tree)
3. CAPTURE screenshot → assert visual content (pixel analysis)
4. INTERACT (tap, swipe, etc.)
5. DUMP layout  → assert new page identity
6. CAPTURE screenshot → assert visual change
```

### Priority order

1. **Layout verification FIRST** — answers "what page is this?" reliably
2. **Screenshot verification SECOND** — answers "does it look right?" for visual regression

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `hdc: command not found` | Set full path to hdc.exe or add SDK toolchains to PATH |
| `uitest: unrecognized option` | Use `-p` not `-o` for savePath; `-b` not `-p` for bundleName |
| `DumpLayout saved to:` but no file | Check bundle name matches the running app |
| Layout JSON has few components | App may not be fully rendered; wait longer or check for crashes |
| Screenshot is all black | Device display may be off; wake device first |
| PIL/Pillow not installed | `pip install Pillow` |
| Tab labels not in component tree | Check bundle name; some apps use images not text for tabs |
| `aa start` fails | Verify bundle name and ability name are correct |
