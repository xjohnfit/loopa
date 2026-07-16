#!/usr/bin/env python3
"""Generates Loopa's app icon, adaptive icon layers, splash mark, and favicon.

Brand mark: a gapped progress ring (the "loop") wrapped around a checkmark —
ties directly into the in-app daily progress ring. Re-run after changing the
palette in mobile/src/theme/colors.ts to keep the art in sync.
"""

import math
import numpy as np
from PIL import Image, ImageDraw

SS = 4  # supersample factor for smooth anti-aliased curves
OUT = "assets"

VIOLET = (109, 93, 246)      # #6D5DF6
INDIGO = (67, 56, 202)       # #4338CA
NAVY = (15, 16, 36)          # #0F1024
WHITE = (255, 255, 255)
TINT_BG = (216, 216, 220)    # #D8D8DC
TINT_FG = (58, 58, 60)       # #3A3A3C


def gradient_square(size, c1, c2):
    """Diagonal (top-left -> bottom-right) linear gradient, RGB."""
    t = np.fromfunction(lambda y, x: (x + y) / (2 * (size - 1)), (size, size), dtype=np.float64)
    arr = np.empty((size, size, 3), dtype=np.uint8)
    for i in range(3):
        arr[:, :, i] = (c1[i] + (c2[i] - c1[i]) * t).astype(np.uint8)
    return Image.fromarray(arr, "RGB")


def rounded_mask(size, radius_ratio):
    mask = Image.new("L", (size, size), 0)
    d = ImageDraw.Draw(mask)
    r = int(size * radius_ratio)
    d.rounded_rectangle([0, 0, size - 1, size - 1], radius=r, fill=255)
    return mask


def draw_round_polyline(draw, points, width, fill):
    for a, b in zip(points, points[1:]):
        draw.line([a, b], fill=fill, width=width)
    r = width / 2
    for x, y in points:
        draw.ellipse([x - r, y - r, x + r, y + r], fill=fill)


def paint_mark(canvas, color, scale):
    """Paints the loop-ring + checkmark mark, centered, onto an RGBA canvas."""
    size = canvas.size[0]
    draw = ImageDraw.Draw(canvas)
    cx = cy = size / 2
    r_outer = size / 2 * scale
    ring_w = r_outer * 0.16
    r_inner = r_outer - ring_w

    gap_start, gap_end = 300, 330  # degrees, PIL convention (0 = 3 o'clock, clockwise)
    bbox = [cx - r_outer + ring_w / 2, cy - r_outer + ring_w / 2,
            cx + r_outer - ring_w / 2, cy + r_outer - ring_w / 2]
    draw.arc(bbox, gap_end, gap_start + 360, fill=color, width=int(ring_w))
    # round off the arc's two cut ends
    for ang in (gap_start, gap_end):
        rad = math.radians(ang)
        rmid = r_outer - ring_w / 2
        x, y = cx + rmid * math.cos(rad), cy + rmid * math.sin(rad)
        rr = ring_w / 2
        draw.ellipse([x - rr, y - rr, x + rr, y + rr], fill=color)

    # checkmark, proportions borrowed from a classic 24x24 check glyph
    k = r_inner / 10
    pts = [(cx - 8 * k, cy + 0 * k), (cx - 3 * k, cy + 5 * k), (cx + 8 * k, cy - 6 * k)]
    draw_round_polyline(draw, pts, width=int(r_inner * 0.24), fill=color)


def composed_icon(target_size, bg, mark_color, mark_scale, corner_radius_ratio=0.0):
    """bg: ('gradient', c1, c2) | ('flat', color) | ('transparent',)"""
    S = target_size * SS
    if bg[0] == "transparent":
        canvas = Image.new("RGBA", (S, S), (0, 0, 0, 0))
    elif bg[0] == "flat":
        canvas = Image.new("RGBA", (S, S), bg[1] + (255,))
    else:
        canvas = gradient_square(S, bg[1], bg[2]).convert("RGBA")

    paint_mark(canvas, mark_color, mark_scale)

    if corner_radius_ratio > 0:
        base = Image.new("RGBA", (S, S), (0, 0, 0, 0))
        base.paste(canvas, (0, 0), rounded_mask(S, corner_radius_ratio))
        canvas = base

    return canvas.resize((target_size, target_size), Image.LANCZOS)


def save(img, name, opaque=False):
    if opaque:
        img = img.convert("RGB")
    img.save(f"{OUT}/{name}", optimize=True)
    print(f"wrote {OUT}/{name}  {img.size[0]}x{img.size[1]}")


if __name__ == "__main__":
    # Primary app icon — full-bleed gradient, OS applies its own corner mask.
    save(composed_icon(1024, ("gradient", VIOLET, INDIGO), WHITE, 0.78), "icon.png", opaque=True)

    # iOS dark / tinted variants (iOS 18+)
    save(composed_icon(1024, ("flat", NAVY), WHITE, 0.78), "icon-dark.png", opaque=True)
    save(composed_icon(1024, ("flat", TINT_BG), TINT_FG, 0.78), "icon-tinted.png", opaque=True)

    # Android adaptive icon layers (foreground/monochrome must stay inside the ~66% safe zone)
    save(composed_icon(1024, ("transparent",), WHITE, 0.58), "android-icon-foreground.png")
    save(composed_icon(1024, ("gradient", VIOLET, INDIGO), WHITE, 0.58), "android-icon-background.png", opaque=True)
    save(composed_icon(1024, ("transparent",), WHITE, 0.58), "android-icon-monochrome.png")

    # Splash mark — transparent, composited over a solid brand color by expo-splash-screen
    save(composed_icon(1024, ("transparent",), WHITE, 0.8), "splash-icon.png")

    # Favicon — shown un-masked in a browser tab, so round its corners ourselves
    save(composed_icon(196, ("gradient", VIOLET, INDIGO), WHITE, 0.78, corner_radius_ratio=0.22), "favicon.png")

    print("done")
