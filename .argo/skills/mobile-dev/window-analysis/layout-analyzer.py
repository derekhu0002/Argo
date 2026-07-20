#!/usr/bin/env python3
"""
Layout Analyzer — parse HarmonyOS uitest dumpLayout JSON and perform assertions.

Usage:
    python layout-analyzer.py <layout.json> [options]

Options:
    --summary              Print pagePath, all texts, component type counts
    --find-text TEXT       Check if TEXT exists in component tree (exit 0=found, 1=not)
    --find-type TYPE       Check if component TYPE exists (exit 0=found, 1=not)
    --min-components N     Verify at least N components rendered
    --tab-labels L1,L2,..  Verify tab labels match (comma-separated)
    --page-path PATH       Verify pagePath matches PATH
    --dump-json            Output structured JSON to stdout (for machine consumption)
    --assert-dimension TEXT MIN_W MAX_W MIN_H MAX_H  Verify component width/height range
    --assert-bgcolor TEXT #HEX  Verify component backgroundColor matches hex
    --count-clickable-in-region Y1 Y2 MIN MAX  Verify clickable count in top-band
    --list-card-rows MIN_H MAX_H  List card rows grouped by Y proximity with avg sizes

Exit codes: 0 = all checks passed, 1 = any check failed
"""
import json
import sys
import os
from collections import Counter


def parse_bounds(bounds_str):
    """Parse '[L,T][R,B]' into numeric dict. Returns None if malformed."""
    try:
        parts = bounds_str.replace('[', '').replace(']', ',').split(',')
        nums = [int(p.strip()) for p in parts if p.strip().lstrip('-').isdigit()]
        if len(nums) >= 4:
            return {
                'left': nums[0], 'top': nums[1],
                'right': nums[2], 'bottom': nums[3],
                'width': nums[2] - nums[0],
                'height': nums[3] - nums[1],
            }
    except (ValueError, IndexError):
        pass
    return None


def parse_layout(path):
    """Parse uitest dumpLayout JSON into structured dict."""
    if not os.path.exists(path):
        return {"pagePath": None, "texts": [], "components": [], "type_counts": Counter()}

    with open(path, 'r', encoding='utf-8') as f:
        root = json.load(f)

    texts = []
    components = []

    def collect(node, depth=0):
        attrs = node.get('attributes', {})
        info = {
            'depth': depth,
            'type': attrs.get('type', ''),
            'text': attrs.get('text', ''),
            'id': attrs.get('id', ''),
            'pagePath': attrs.get('pagePath', ''),
            'bounds': attrs.get('bounds', ''),
            'clickable': attrs.get('clickable', '') == 'true',
            'enabled': attrs.get('enabled', '') == 'true',
            'hint': attrs.get('hint', ''),
            'description': attrs.get('description', ''),
        }
        if info['text']:
            texts.append(info['text'])
        if info['type']:
            info['backgroundColor'] = attrs.get('backgroundColor', '')
            components.append(info)
        for child in node.get('children', []):
            collect(child, depth + 1)

    collect(root)

    # Extract pagePath
    page_path = None

    def find_page_path(node):
        pp = node.get('attributes', {}).get('pagePath', '')
        if pp:
            return pp
        for child in node.get('children', []):
            r = find_page_path(child)
            if r:
                return r
        return None

    page_path = find_page_path(root)
    type_counts = Counter(c['type'] for c in components)

    return {
        'pagePath': page_path,
        'texts': texts,
        'components': components,
        'type_counts': type_counts,
    }


def print_summary(parsed):
    """Print a human-readable summary of the layout."""
    print(f"pagePath: {parsed['pagePath']}")
    print(f"Total components: {len(parsed['components'])}")
    print(f"\nTexts on screen ({len(parsed['texts'])}):")
    for t in parsed['texts']:
        try:
            print(f'  "{t}"')
        except UnicodeEncodeError:
            print(f'  "(emoji)"')
    print(f"\nComponent types:")
    for t, c in parsed['type_counts'].most_common():
        print(f"  {t}: {c}")

    # Show clickable components
    clickables = [c for c in parsed['components'] if c['clickable']]
    if clickables:
        print(f"\nClickable components ({len(clickables)}):")
        for c in clickables:
            print(f"  [{c['bounds']}] {c['type']} text=\"{c['text']}\"")

    # Show components with hints
    hinted = [c for c in parsed['components'] if c['hint']]
    if hinted:
        print(f"\nInput hints:")
        for c in hinted:
            print(f"  [{c['bounds']}] {c['type']} hint=\"{c['hint']}\"")


def dump_json(parsed):
    """Output structured JSON for machine consumption by cross-platform diff tools."""
    clickables = []
    for c in parsed['components']:
        if c['clickable']:
            clickables.append({
                'bounds': c['bounds'],
                'type': c['type'],
                'label': c['text'] or '',
            })

    hints = []
    for c in parsed['components']:
        if c['hint']:
            hints.append({'bounds': c['bounds'], 'type': c['type'], 'hint': c['hint']})

    # Add parsed numeric bounds to each clickable
    for c in clickables:
        parsed_b = parse_bounds(c['bounds'])
        if parsed_b:
            c['bounds_parsed'] = parsed_b

    output = {
        'platform': 'harmonyos',
        'pagePath': parsed['pagePath'],
        'component_count': len(parsed['components']),
        'texts': parsed['texts'],
        'clickable_count': len(clickables),
        'clickables': clickables,
        'type_counts': dict(parsed['type_counts']),
        'hints': hints,
    }
    # Force UTF-8 and use ensure_ascii=True for safe subprocess capture on Windows
    sys.stdout.reconfigure(encoding='utf-8')
    print(json.dumps(output, ensure_ascii=True, indent=2))


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    layout_path = sys.argv[1]
    parsed = parse_layout(layout_path)

    if not parsed['components']:
        print(f"ERROR: Cannot parse layout file: {layout_path}")
        sys.exit(1)

    args = sys.argv[2:]
    checks_passed = 0
    checks_failed = 0

    i = 0
    while i < len(args):
        arg = args[i]

        if arg == '--summary':
            print_summary(parsed)

        elif arg == '--find-text':
            i += 1
            text = args[i]
            found = text in parsed['texts']
            if found:
                print(f"PASS: Text '{text}' found in component tree")
                checks_passed += 1
            else:
                print(f"FAIL: Text '{text}' NOT found. Available: {parsed['texts']}")
                checks_failed += 1

        elif arg == '--find-type':
            i += 1
            ctype = args[i]
            count = parsed['type_counts'].get(ctype, 0)
            if count > 0:
                print(f"PASS: Component type '{ctype}' found ({count} instances)")
                checks_passed += 1
            else:
                print(f"FAIL: Component type '{ctype}' NOT found")
                checks_failed += 1

        elif arg == '--min-components':
            i += 1
            min_count = int(args[i])
            actual = len(parsed['components'])
            if actual >= min_count:
                print(f"PASS: {actual} components >= {min_count} (fully rendered)")
                checks_passed += 1
            else:
                print(f"FAIL: Only {actual} components (expected >= {min_count})")
                checks_failed += 1

        elif arg == '--tab-labels':
            i += 1
            expected = [t.strip() for t in args[i].split(',')]
            known_labels = {"Home", "Search", "Cart", "Profile"}
            found_labels = [t for t in parsed['texts'] if t in known_labels]
            if found_labels == expected:
                print(f"PASS: Tab labels match: {found_labels}")
                checks_passed += 1
            else:
                print(f"FAIL: Tab labels: expected {expected}, got {found_labels}")
                checks_failed += 1

        elif arg == '--page-path':
            i += 1
            expected_path = args[i]
            if parsed['pagePath'] == expected_path:
                print(f"PASS: pagePath matches '{expected_path}'")
                checks_passed += 1
            else:
                print(f"FAIL: pagePath: expected '{expected_path}', got '{parsed['pagePath']}'")
                checks_failed += 1

        elif arg == '--assert-dimension':
            i += 1
            search_text = args[i]
            i += 1; min_w = int(args[i])
            i += 1; max_w = int(args[i])
            i += 1; min_h = int(args[i])
            i += 1; max_h = int(args[i])
            found = None
            for c in parsed['components']:
                if c['text'] == search_text:
                    found = c
                    break
            if found:
                pb = parse_bounds(found['bounds'])
                if pb:
                    w_ok = min_w <= pb['width'] <= max_w
                    h_ok = min_h <= pb['height'] <= max_h
                    if w_ok and h_ok:
                        print(f"PASS: '{search_text}' dimensions {pb['width']}x{pb['height']} in [{min_w}-{max_w}]x[{min_h}-{max_h}]")
                        checks_passed += 1
                    else:
                        print(f"FAIL: '{search_text}' dimensions {pb['width']}x{pb['height']} NOT in [{min_w}-{max_w}]x[{min_h}-{max_h}]")
                        checks_failed += 1
                else:
                    print(f"FAIL: Cannot parse bounds for '{search_text}'")
                    checks_failed += 1
            else:
                print(f"FAIL: Component with text '{search_text}' not found")
                checks_failed += 1

        elif arg == '--assert-bgcolor':
            i += 1
            search_text = args[i]
            i += 1
            expected_hex = args[i].upper().replace('#', '')
            found = None
            for c in parsed['components']:
                if c['text'] == search_text:
                    found = c
                    break
            if found:
                actual_bg = (found.get('backgroundColor') or '').upper().replace('#', '')
                if actual_bg == expected_hex:
                    print(f"PASS: '{search_text}' backgroundColor matches #{expected_hex}")
                    checks_passed += 1
                elif actual_bg == '00000000' and expected_hex == '00000000':
                    print(f"PASS: '{search_text}' backgroundColor is transparent (expected)")
                    checks_passed += 1
                else:
                    print(f"FAIL: '{search_text}' backgroundColor #{actual_bg} != #{expected_hex}")
                    checks_failed += 1
            else:
                print(f"FAIL: Component with text '{search_text}' not found for bgcolor check")
                checks_failed += 1

        elif arg == '--list-card-rows':
            i += 1; min_h = int(args[i])
            i += 1; max_h = int(args[i])
            cards = []
            for c in parsed['components']:
                pb = parse_bounds(c['bounds'])
                if pb and c['clickable'] and min_h <= pb['height'] <= max_h:
                    cards.append({'top': pb['top'], 'w': pb['width'], 'h': pb['height'], 'l': c['text'] or ''})
            cards.sort(key=lambda x: x['top'])
            rows = []
            for c in cards:
                if not rows or c['top'] - rows[-1][-1]['top'] > 50:
                    rows.append([c])
                else:
                    rows[-1].append(c)
            print(f'Card rows (h={min_h}-{max_h}px): {len(rows)}')
            for ri, row in enumerate(rows):
                aw = sum(c['w'] for c in row)//len(row)
                ah = sum(c['h'] for c in row)//len(row)
                lbs = [c['l'] for c in row if c['l']]
                print(f'  Row {ri}: {len(row)} cards, avg {aw}x{ah}px, labels={lbs}')
            checks_passed += 1

        elif arg == '--count-clickable-in-region':
            i += 1; y1 = int(args[i])
            i += 1; y2 = int(args[i])
            i += 1; c_min = int(args[i])
            i += 1; c_max = int(args[i])
            count = 0
            for c in parsed['components']:
                pb = parse_bounds(c['bounds'])
                if pb and c['clickable'] and y1 <= pb['top'] <= y2:
                    count += 1
            if c_min <= count <= c_max:
                print(f"PASS: {count} clickable in region [{y1}-{y2}] (expected [{c_min}-{c_max}])")
                checks_passed += 1
            else:
                print(f"FAIL: {count} clickable in region [{y1}-{y2}] (expected [{c_min}-{c_max}])")
                checks_failed += 1

        elif arg == '--dump-json':
            dump_json(parsed)
            sys.exit(0)

        else:
            print(f"WARNING: Unknown option: {arg}")

        i += 1

    # Summary
    total = checks_passed + checks_failed
    if total > 0:
        print(f"\n{'='*50}")
        if checks_failed == 0:
            print(f"ALL CHECKS PASSED ({checks_passed}/{total})")
            sys.exit(0)
        else:
            print(f"SOME CHECKS FAILED ({checks_passed}/{total} passed, {checks_failed} failed)")
            sys.exit(1)

    # If only --summary, exit 0
    sys.exit(0)


if __name__ == '__main__':
    main()
