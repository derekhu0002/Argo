---
name: android-window-analysis
description: Guide for analyzing Android app UI windows — layout verification (uiautomator XML dump) and image verification (screencap screenshots). Use when you need to confirm what page is displayed, verify UI component structure, check text content, or validate visual appearance on a connected Android device/emulator.
---

# Android Window Analysis Skill

Use this skill when the task needs to analyze an Android app's current UI window through either:

1. **Layout Verification** — component tree inspection via `adb shell uiautomator dump`
2. **Image Verification** — screenshot capture and pixel analysis via `adb exec-out screencap -p`

## Prerequisites

- **ADB** installed (Android SDK platform-tools), typically at:
  `C:/Users/admin/AppData/Local/Android/Sdk/platform-tools/adb.exe`
- **Android emulator** or device connected (verify with `adb devices`)
- See `emulator-setup` SKILL for emulator startup instructions
- App package name known (e.g., `com.example.jetsnack`)
- Python 3.10+ with Pillow (`pip install Pillow`) for screenshot analysis

## Runtime Boundary

- Public entrypoint: `.github/skills/android-window-analysis/run.js`
- Companion scripts:
  - `.github/skills/android-window-analysis/layout-analyzer.py` — standalone uiautomator XML analyzer
  - `.github/skills/android-window-analysis/screenshot-analyzer.py` — standalone screenshot pixel analyzer
- Artifact root: project root (screenshots and layout dumps land here)
- Compatibility pointer: `work/skills/android-window-analysis/SKILL.md`

---

## Part A: Layout Verification (uiautomator dump)

Use layout verification when you need to **confirm page identity** — i.e., answer "is the current screen really the Feed page?" This is more reliable than screenshot pixel analysis because it reads actual UI component structure.

### A.1 Dump the component tree

```bash
adb shell uiautomator dump /sdcard/ui_dump.xml
adb pull /sdcard/ui_dump.xml <localPath>
```

The output is an **XML tree** with this structure per node:

```xml
<node index="0"
      text="Android's picks"              <!-- visible text -->
      content-desc="Filters"              <!-- accessibility / Compose semantics -->
      resource-id="android:id/content"    <!-- Android resource ID -->
      class="android.widget.TextView"     <!-- Android widget class -->
      package="com.example.jetsnack"      <!-- app package -->
      bounds="[63,399][473,463]"          <!-- pixel bounds [left,top][right,bottom] -->
      clickable="true/false"
      enabled="true/false"
      focusable="true/false"
      scrollable="true/false"
      checkable="true/false"
      checked="true/false"
      selected="true/false"
      long-clickable="true/false" />
```

### A.2 Key differences from HarmonyOS

| Aspect | Android (uiautomator) | HarmonyOS (uitest dumpLayout) |
|---|---|---|
| Format | XML | JSON |
| Page identity | Inferred from text/content-desc | Explicit `pagePath` attribute |
| Text source | `text` + `content-desc` (Compose uses `content-desc`) | `text` only |
| Component type | `class` (e.g., `android.widget.TextView`) | `type` (e.g., `Text`) |
| Compose apps | Nodes are generic `View`; semantics in `content-desc` | N/A (ArkUI native) |
| Capture command | `adb shell uiautomator dump /sdcard/...` | `hdc shell uitest dumpLayout -p ...` |

### A.3 Key assertions

| Assertion | How | Example |
|---|---|---|
| **Page identity** | Check `text` or `content-desc` for page-specific strings | Feed page has "Android's picks" |
| **Tab labels** | Filter `text` + `content-desc` for known tab names | HOME, SEARCH, MY CART, PROFILE |
| **Component types** | Count by `class` (last segment) | TextView: 16, Button: 5 |
| **Component count** | Total non-root nodes | ≥ 80 = fully rendered (Compose apps have many View nodes) |
| **Clickable elements** | Check `clickable="true"` | Tab bar items, filter chips, cards |
| **Element bounds** | Parse `bounds` for layout positions | Tab bar Y-range ~2201-2327 |
| **Element dimensions** | `--assert-dimension "Cupcake" 50 200 10 80` | Verify component width/height in px range |
| **Text presence** | Search `text` values | "Delivery to 1600 Amphitheater Way" |
| **Content descriptions** | Search `content-desc` (Compose semantics) | "Filters", "Select delivery address" |

### A.4 Using the layout analyzer script

```bash
python .github/skills/android-window-analysis/layout-analyzer.py <ui_dump.xml> [options]
```

**Options:**
- `--summary` — print all texts, content-descs, class counts, key nodes
- `--find-text "..."` — check if text exists (searches both `text` and `content-desc`)
- `--find-class "..."` — check if component class exists (e.g., "TextView", "Button")
- `--min-components N` — verify at least N components rendered
- `--tab-labels "HOME,SEARCH,CART,PROFILE"` — verify tab labels match
- `--has-clickable` — verify at least one clickable component exists
- `--assert-dimension "Text" MIN_W MAX_W MIN_H MAX_H` — verify component size in px
- `--dump-json` — output structured JSON with parsed numeric bounds

**Exit codes:** 0 = pass, 1 = fail

### A.5 Agent workflow for layout verification

```
1. adb devices                          → confirm device connected
2. adb shell am start -n <pkg>/<activity>  → launch target app
3. adb shell uiautomator dump /sdcard/ui_dump.xml  → dump component tree
4. adb pull /sdcard/ui_dump.xml <localPath> → pull XML to local
5. python layout-analyzer.py ... --summary    → inspect structure
6. python layout-analyzer.py ... --find-text "..." → assert page identity
7. python layout-analyzer.py ... --min-components N → assert full render
```

---

## Part B: Image Verification (screencap)

Use image verification for **visual regression** — color checking, blank-screen detection, theme validation, and before/after navigation comparison.

### B.1 Capture a screenshot

```bash
adb shell screencap -p /sdcard/screenshot.png
adb pull /sdcard/screenshot.png <localPath>
```

> **Important on Windows**: Use `adb pull` to avoid PNG corruption. `exec-out screencap -p > file.png` via PowerShell can corrupt binary data.

The output is a PNG image at the device's native resolution (e.g., 1080×2400).

### B.2 Key assertions

| Assertion | How | Threshold |
|---|---|---|
| **Not blank** | Count unique RGB colors across sampled pixels | > 100 unique colors |
| **Region not blank** | Crop region then count unique colors | > 50 for small regions |
| **Page changed** | Compare two screenshots pixel-by-pixel | > 2% pixels differ |
| **Contains color** | Check if any pixel matches target hex ±30 tolerance | Any match |
| **Mean color** | Average RGB across region | — |
| **Dark theme** | Mean brightness < 80 | — |

### B.3 Using the screenshot analyzer script

```bash
python .github/skills/android-window-analysis/screenshot-analyzer.py <screenshot.png> [options]
```

**Options:** (same as HarmonyOS version)
- `--not-blank [threshold]` — verify screenshot has content
- `--region L,T,R,B --not-blank [threshold]` — verify region has content
- `--diff <other.png>` — verify two screenshots differ
- `--mean-color` — print mean RGB
- `--is-dark` — check dark theme
- `--assert-color-at-bounds L,T,R,B #HEX [tolerance]` — crop to bounds, check color exists

**Exit codes:** 0 = pass, 1 = fail

### B.4 Agent workflow for image verification

```
1. adb shell screencap -p /sdcard/screenshot.png   → capture to device
2. adb pull /sdcard/screenshot.png <localPath>     → pull to local
3. python screenshot-analyzer.py ... --not-blank    → verify content
4. python screenshot-analyzer.py ... --diff before.png → verify page changed
```

---

## Part C: Combined Workflow (Recommended)

```
1. LAUNCH: adb shell am start -n <pkg>/<activity>
2. LAYOUT: adb shell uiautomator dump + analyze → confirm page identity
3. SCREENSHOT: adb exec-out screencap -p + analyze → confirm visuals
4. INTERACT: adb shell input tap <x> <y>
5. LAYOUT: re-dump + analyze → confirm new page
6. SCREENSHOT: re-capture + diff → confirm visual change
```

### Priority order

1. **Layout verification FIRST** — "what page is this?" via text/content-desc
2. **Screenshot verification SECOND** — "does it look right?" for visual regression

---

## Key Android-specific Notes

### Compose apps (like Jetsnack)

Jetpack Compose renders UI into a `ComposeView` containing generic `android.view.View` nodes. The component hierarchy is **flattened** — you won't see `LazyColumn`, `Text`, or `Button` in the class names. Instead:

- **Text content** is in `text` attribute (for `TextView` nodes)
- **Semantic labels** (icons, buttons without text) are in `content-desc`
- **Most interactive elements** are `clickable="true"` on `View` nodes

### Tab bar detection

On Android, tab bars are typically a row of `View` nodes with `clickable="true"` and `content-desc` set (e.g., "HOME", "SEARCH"). They appear near the bottom of the screen.

### Filter chips / category buttons

These are `clickable="true"` views containing `TextView` children with filter names like "Organic", "Gluten-free".

---

## Troubleshooting

| Problem | Solution |
|---|---|
| `adb: no devices/emulators found` | Run `adb devices`, check emulator is booted (see `emulator-setup` SKILL) |
| `uiautomator dump` returns empty XML | App may not be fully rendered; wait 2-3 seconds and retry |
| XML has only a few `View` nodes | App might be crashed or blank; take a screenshot to verify |
| `screencap -p` produces corrupted PNG | Use `exec-out` not `shell` to avoid CRLF corruption |
| Compose `content-desc` is empty | Some Compose components need explicit `semantics {}` modifier |
| PIL/Pillow not installed | `pip install Pillow` |
