#!/usr/bin/env python3
"""
Android Layout Analyzer — parse uiautomator dump XML and perform assertions.

Usage:
    python layout-analyzer.py <ui_dump.xml> [options]

Options:
    --summary              Print all texts, content-descs, class counts, key nodes
    --find-text TEXT       Check if TEXT exists in text OR content-desc (exit 0=found, 1=not)
    --find-class CLASS     Check if component CLASS exists (e.g., "TextView", "Button")
    --min-components N     Verify at least N components rendered
    --tab-labels L1,L2,..  Verify tab labels match (comma-separated, checks content-desc)
    --has-clickable        Verify at least one clickable component exists
    --dump-json            Output structured JSON to stdout (for machine consumption)

Exit codes: 0 = all checks passed, 1 = any check failed
"""
import xml.etree.ElementTree as ET
import sys
import os
import json
from collections import Counter


def parse_layout(path):
    """Parse uiautomator dump XML into structured dict."""
    if not os.path.exists(path):
        return {"texts": [], "content_descs": [], "components": [], "class_counts": Counter()}

    tree = ET.parse(path)
    root = tree.getroot()

    texts = []
    content_descs = []
    components = []

    def walk(node, depth=0):
        attrs = node.attrib
        info = {
            'depth': depth,
            'class': attrs.get('class', '').split('.')[-1],
            'full_class': attrs.get('class', ''),
            'text': attrs.get('text', ''),
            'content_desc': attrs.get('content-desc', ''),
            'resource_id': attrs.get('resource-id', ''),
            'bounds': attrs.get('bounds', ''),
            'clickable': attrs.get('clickable', '') == 'true',
            'enabled': attrs.get('enabled', '') == 'true',
            'focusable': attrs.get('focusable', '') == 'true',
            'scrollable': attrs.get('scrollable', '') == 'true',
            'package': attrs.get('package', ''),
            'index': attrs.get('index', ''),
        }
        if info['text']:
            texts.append(info['text'])
        if info['content_desc']:
            content_descs.append(info['content_desc'])
        components.append(info)
        for child in node:
            walk(child, depth + 1)

    walk(root)
    class_counts = Counter(c['class'] for c in components)

    return {
        'texts': texts,
        'content_descs': content_descs,
        'components': components,
        'class_counts': class_counts,
    }


def print_summary(parsed):
    """Print a human-readable summary of the layout."""
    print(f"Total components: {len(parsed['components'])}")
    print(f"\nTexts on screen ({len(parsed['texts'])}):")
    for t in parsed['texts']:
        print(f'  "{t}"')
    print(f"\nContent descriptions ({len(parsed['content_descs'])}):")
    for d in parsed['content_descs']:
        print(f'  "{d}"')
    print(f"\nComponent classes:")
    for c, cnt in parsed['class_counts'].most_common(20):
        print(f"  {c}: {cnt}")

    # Show clickable components
    clickables = [c for c in parsed['components'] if c['clickable']]
    if clickables:
        print(f"\nClickable components ({len(clickables)}):")
        for c in clickables:
            label = c['text'] or c['content_desc'] or '(no label)'
            print(f"  [{c['bounds']}] {c['class']} label=\"{label}\"")


def find_text_in_all(parsed, text):
    """Check if text exists in either text or content-desc fields."""
    return text in parsed['texts'] or text in parsed['content_descs']


def dump_json(parsed):
    """Output structured JSON for machine consumption by cross-platform diff tools."""
    clickables = []
    for c in parsed['components']:
        if c['clickable']:
            clickables.append({
                'bounds': c['bounds'],
                'class': c['class'],
                'label': c['text'] or c['content_desc'] or '',
            })

    output = {
        'platform': 'android',
        'component_count': len(parsed['components']),
        'texts': parsed['texts'],
        'content_descs': parsed['content_descs'],
        'all_labels': parsed['texts'] + parsed['content_descs'],
        'clickable_count': len(clickables),
        'clickables': clickables,
        'class_counts': dict(parsed['class_counts']),
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
            found = find_text_in_all(parsed, text)
            if found:
                print(f"PASS: Text '{text}' found (text or content-desc)")
                checks_passed += 1
            else:
                print(f"FAIL: Text '{text}' NOT found.")
                print(f"  Available texts: {parsed['texts']}")
                print(f"  Available content-descs: {parsed['content_descs']}")
                checks_failed += 1

        elif arg == '--find-class':
            i += 1
            ctype = args[i]
            count = parsed['class_counts'].get(ctype, 0)
            if count > 0:
                print(f"PASS: Class '{ctype}' found ({count} instances)")
                checks_passed += 1
            else:
                print(f"FAIL: Class '{ctype}' NOT found")
                print(f"  Available classes: {list(parsed['class_counts'].keys())}")
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
            # Tab labels in Android are typically in content-desc (Compose) or text
            found_labels = [t for t in parsed['content_descs'] if t in expected]
            # Also check texts for fallback
            found_labels += [t for t in parsed['texts'] if t in expected and t not in found_labels]
            if set(found_labels) == set(expected):
                print(f"PASS: Tab labels match: {found_labels}")
                checks_passed += 1
            else:
                print(f"FAIL: Tab labels: expected {expected}, got {found_labels}")
                checks_failed += 1

        elif arg == '--has-clickable':
            clickables = [c for c in parsed['components'] if c['clickable']]
            if clickables:
                print(f"PASS: {len(clickables)} clickable components found")
                checks_passed += 1
            else:
                print("FAIL: No clickable components found")
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

    sys.exit(0)


if __name__ == '__main__':
    main()
