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

Exit codes: 0 = all checks passed, 1 = any check failed
"""
import json
import sys
import os
from collections import Counter


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
        print(f'  "{t}"')
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
