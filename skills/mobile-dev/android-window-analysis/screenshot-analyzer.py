#!/usr/bin/env python3
"""
Android Screenshot Analyzer — verify Android screenshots (PNG) via pixel analysis.

Usage:
    python screenshot-analyzer.py <screenshot.png> [options]

Options:
    --summary                     Print all checks as pass/fail summary
    --not-blank [threshold]       Verify screenshot has content (default threshold: 100 unique colors)
    --region L,T,R,B              Set crop region for subsequent checks (left,top,right,bottom)
    --diff <other.png>            Verify two screenshots differ (>2% pixel change)
    --mean-color                  Print mean RGB of image (or region if set)
    --contains-color #HEX         Check if any pixel matches target color (30 tolerance)
    --is-dark                     Check if screenshot shows dark theme (brightness < 80)

Exit codes: 0 = all checks passed, 1 = any check failed

Note: This is functionally identical to the HarmonyOS screenshot-analyzer.py
      since both output standard JPEG/PNG image files.
"""
import sys
import os

try:
    from PIL import Image
except ImportError:
    print("ERROR: Pillow not installed. Run: pip install Pillow")
    sys.exit(2)


def count_unique_colors(img, stride=10):
    """Count unique RGB colors in image at given stride."""
    pixels = set()
    for y in range(0, img.height, stride):
        for x in range(0, img.width, stride):
            pixels.add(img.getpixel((x, y))[:3])
    return len(pixels)


def get_mean_color(img):
    """Get mean RGB color of image."""
    try:
        pixels = list(img.get_flattened_data())
    except AttributeError:
        pixels = list(img.getdata())
    if not pixels:
        return None
    r = sum(p[0] for p in pixels) // len(pixels)
    g = sum(p[1] for p in pixels) // len(pixels)
    b = sum(p[2] for p in pixels) // len(pixels)
    return (r, g, b)


def check_color_present(img, hex_color):
    """Check if any pixel matches target color within tolerance 30."""
    target = tuple(int(hex_color.lstrip('#')[i:i + 2], 16) for i in (0, 2, 4))
    for y in range(0, img.height, 5):
        for x in range(0, img.width, 5):
            p = img.getpixel((x, y))
            if all(abs(p[i] - target[i]) < 30 for i in range(3)):
                return True, (x, y)
    return False, None


def check_images_different(path_a, path_b):
    """Verify two screenshots show different content (>2% pixel change)."""
    if not os.path.exists(path_a) or not os.path.exists(path_b):
        return False, "One or both files missing"

    size_a = os.path.getsize(path_a)
    size_b = os.path.getsize(path_b)
    if abs(size_a - size_b) > max(size_a, size_b) * 0.03:
        return True, f"File sizes differ ({size_a} vs {size_b})"

    img_a = Image.open(path_a)
    img_b = Image.open(path_b)
    if img_a.size != img_b.size:
        return True, f"Image sizes differ ({img_a.size} vs {img_b.size})"

    diffs = 0
    total = 0
    for y in range(0, img_a.height, 15):
        for x in range(0, img_a.width, 15):
            total += 1
            pa = img_a.getpixel((x, y))
            pb = img_b.getpixel((x, y))
            if any(abs(pa[i] - pb[i]) > 20 for i in range(3)):
                diffs += 1

    ratio = diffs / max(total, 1)
    result = ratio > 0.02
    return result, f"{diffs}/{total} pixels differ ({ratio:.1%})"


def main():
    if len(sys.argv) < 2:
        print(__doc__)
        sys.exit(1)

    img_path = sys.argv[1]
    if not os.path.exists(img_path):
        print(f"ERROR: Screenshot not found: {img_path}")
        sys.exit(1)

    img = Image.open(img_path)
    checks_passed = 0
    checks_failed = 0
    current_region = None

    args = sys.argv[2:]
    i = 0
    while i < len(args):
        arg = args[i]

        if arg == '--region':
            i += 1
            parts = args[i].split(',')
            current_region = tuple(int(p.strip()) for p in parts)
            print(f"  [REGION] Set crop region: {current_region}")

        elif arg == '--not-blank':
            i += 1
            threshold = 100
            if i < len(args) and args[i].isdigit():
                threshold = int(args[i])
            else:
                i -= 1

            target_img = img
            if current_region:
                target_img = img.crop(current_region)

            unique = count_unique_colors(target_img)
            if unique > threshold:
                region_label = f" region={current_region}" if current_region else ""
                print(f"PASS: Screenshot not blank{region_label}: {unique} unique colors > {threshold}")
                checks_passed += 1
            else:
                region_label = f" region={current_region}" if current_region else ""
                print(f"FAIL: Screenshot IS BLANK{region_label}: {unique} unique colors <= {threshold}")
                checks_failed += 1

        elif arg == '--diff':
            i += 1
            other_path = args[i]
            is_different, detail = check_images_different(img_path, other_path)
            if is_different:
                print(f"PASS: Screenshots differ: {detail}")
                checks_passed += 1
            else:
                print(f"FAIL: Screenshots are SAME: {detail}")
                checks_failed += 1

        elif arg == '--mean-color':
            target_img = img
            if current_region:
                target_img = img.crop(current_region)
            mean = get_mean_color(target_img)
            region_label = f" region={current_region}" if current_region else ""
            print(f"  [MEAN COLOR]{region_label}: RGB{mean}")

        elif arg == '--contains-color':
            i += 1
            hex_color = args[i]
            target_img = img
            if current_region:
                target_img = img.crop(current_region)
            found, pos = check_color_present(target_img, hex_color)
            if found:
                print(f"PASS: Color {hex_color} found near {pos}")
                checks_passed += 1
            else:
                print(f"FAIL: Color {hex_color} NOT found in screenshot")
                checks_failed += 1

        elif arg == '--is-dark':
            mean = get_mean_color(img)
            if mean is None:
                print("FAIL: Cannot compute mean color")
                checks_failed += 1
            else:
                brightness = (mean[0] + mean[1] + mean[2]) / 3
                if brightness < 80:
                    print(f"PASS: Dark theme detected (brightness={brightness:.0f})")
                    checks_passed += 1
                else:
                    print(f"FAIL: Not dark theme (brightness={brightness:.0f} > 80)")
                    checks_failed += 1

        else:
            print(f"WARNING: Unknown option: {arg}")

        i += 1

    total = checks_passed + checks_failed
    if total > 0:
        print(f"\n{'='*50}")
        if checks_failed == 0:
            print(f"ALL CHECKS PASSED ({checks_passed}/{total})")
            sys.exit(0)
        else:
            print(f"SOME CHECKS FAILED ({checks_passed}/{total} passed, {checks_failed} failed)")
            sys.exit(1)

    print(f"Image: {img_path}")
    print(f"Size: {img.size}")
    print(f"Mode: {img.mode}")
    sys.exit(0)


if __name__ == '__main__':
    main()
