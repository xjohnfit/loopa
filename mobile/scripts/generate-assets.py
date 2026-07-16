#!/usr/bin/env python3
"""Generates Loopa's app icon, adaptive icon layers, splash mark, and favicon.

Brand mark: a geometric "L" monogram whose foot kicks up into a checkmark
flick — doubles as a Loopa letter-mark and a checkmark. Re-run after changing
the palette in mobile/src/theme/colors.ts to keep the art in sync.
"""

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
    """Paints the L-monogram/checkmark mark, centered, onto an RGBA canvas."""
    size = canvas.size[0]
    draw = ImageDraw.Draw(canvas)
    cx = cy = size / 2
    r = size / 2 * scale  # half-height budget the shape is fit inside

    # Points of an "L" whose bottom foot kicks up into a checkmark flick,
    # authored on a -26..26 (y) / -21.5..21.5 (x) grid, then scaled so the
    # vertical half-extent maps to r.
    unit = r / 26
    pts = [
        (-21.5 * unit, -26 * unit),
        (-21.5 * unit, 26 * unit),
        (1.5 * unit, 26 * unit),
        (21.5 * unit, -1 * unit),
    ]
    pts = [(cx + x, cy + y) for x, y in pts]
    draw_round_polyline(draw, pts, width=int(r * 0.33), fill=color)


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

    # Portfolio mark — transparent background, no OS safe-zone constraint, so it
    # can fill more of the frame. Not used by the app itself; lives in ../branding.
    portfolio = composed_icon(1024, ("transparent",), VIOLET, 0.86)
    portfolio.save("../branding/loopa-mark-1024-transparent.png", optimize=True)
    print(f"wrote ../branding/loopa-mark-1024-transparent.png  {portfolio.size[0]}x{portfolio.size[1]}")

    print("done")
