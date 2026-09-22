#!/usr/bin/env python3
"""Generate the hero's halftone field, public/hero-field.webp.

The reference is webcontainers.io, which ships two full-colour JPGs and picks
between them on :root.dark. That bakes the palette into the asset. This writes
a single alpha mask instead: the image carries only opacity, and the colour
comes from --wave-* through a CSS gradient underneath the mask. One file, both
themes, and the palette stays in global.css where the rest of it lives.

The picture is a sheet seen at a low angle. Rows of dots follow one slow cosine
period across the width, high at the left, sagging around 44%, rising again at
the right. Row spacing is squared so rows bunch toward the horizon, dot radius
and opacity grow toward the viewer, and a few arcs ride the same sheet, three
inside the field and three faint ones above it.

Run: python3 scripts/gen-hero-field.py
"""

import math
import random
from pathlib import Path

from PIL import Image, ImageChops, ImageDraw

W, H = 2000, 1240
SS = 2                 # supersample; the only antialiasing PIL's ellipse gets
ROWS, COLS = 118, 190
HORIZON = 0.50         # where the field starts, as a fraction of H
SEED = 7               # fixed so re-running produces a byte-identical file

PUB = Path(__file__).resolve().parent.parent / "public"
OUT = PUB / "hero-field.webp"
OUT_SRC = PUB / "hero-field-src.webp"


def shape(u: float) -> float:
    """Height of the sheet across the width. One slow period, positive = up."""
    return math.cos(2 * math.pi * (u * 0.8 + 0.15))


def sheet(u: float, t: float) -> tuple[float, float]:
    """A point on the sheet. u runs across, t runs from the horizon (0) down (1).

    t is allowed to go negative, which lifts a curve above the horizon into the
    empty half of the image. That is where the faint arcs live.
    """
    y = HORIZON * H + (H - HORIZON * H) * t
    y -= (0.045 + 0.13 * t) * H * shape(u)
    x = W * (0.5 + (u - 0.5) * (0.86 + 0.40 * t))
    return x, y


def smoothstep(edge0: float, edge1: float, x: float) -> float:
    n = min(1.0, max(0.0, (x - edge0) / (edge1 - edge0)))
    return n * n * (3 - 2 * n)


def draw_dots() -> Image.Image:
    layer = Image.new("L", (W * SS, H * SS), 0)
    d = ImageDraw.Draw(layer)
    rng = random.Random(SEED)

    for j in range(ROWS):
        # Squared, so rows crowd together as they approach the horizon.
        t = (j / (ROWS - 1)) ** 2.0
        for i in range(COLS):
            u = i / (COLS - 1)
            x, y = sheet(u, t)

            # The mass belongs in the bottom-left corner, thinning hard to the
            # right. Squared so the drop-off is a fade and not a straight edge.
            across = (1.0 - 0.88 * smoothstep(0.18, 1.02, u)) ** 1.6
            # Brighter where the sheet crests, which is what stops it reading as
            # a flat grid. Clamped below 0 so it only ever adds light: shape()
            # peaks again at the right edge, exactly where across is trying to
            # empty the field out.
            lift = 0.82 + 0.18 * max(0.0, shape(u))
            a = 0.68 * (t ** 0.75) * across * lift
            a *= 0.85 + 0.30 * rng.random()
            if a <= 0.004:
                continue

            r = (0.5 + 5.0 * t) * SS
            # Enough jitter to break the machine regularity, not enough to read
            # as scattered.
            x = x * SS + rng.uniform(-0.6, 0.6) * SS
            y = y * SS + rng.uniform(-0.6, 0.6) * SS
            if x < -r or x > W * SS + r or y < -r or y > H * SS + r:
                continue

            v = int(min(255, max(0, round(a * 255))))
            d.ellipse((x - r, y - r, x + r, y + r), fill=v)

    return layer


def draw_arcs() -> Image.Image:
    layer = Image.new("L", (W * SS, H * SS), 0)
    d = ImageDraw.Draw(layer)

    # (t, alpha, width). Negative t rides above the horizon.
    arcs = [
        (-0.22, 0.055, 2.0),
        (-0.06, 0.085, 2.4),
        (0.14, 0.150, 3.0),
        (0.44, 0.110, 3.6),
    ]

    for t, alpha, width in arcs:
        w = max(1, int(round(width * SS)))
        # Drawn segment by segment so each one can carry its own opacity. One
        # polyline can only have a single fill, which is what made these read as
        # ruled lines running the full width.
        prev = None
        for k in range(601):
            u = -0.05 + (1.10 * k / 600)
            x, y = sheet(u, t)
            pt = (x * SS, y * SS)
            if prev is not None:
                fade = (1.0 - 0.92 * smoothstep(0.10, 0.98, u)) ** 1.3
                v = int(round(alpha * fade * 255))
                if v > 0:
                    d.line([prev, pt], fill=v, width=w)
            prev = pt

    return layer


def draw_source() -> Image.Image:
    """The same sheet as a smooth luminance field, with no dots in it.

    This is the input for Paper Shaders' HalftoneDots, which screens an image
    rather than generating a field: bright areas become fat dots, dark areas
    become small ones. Feeding it the shape on its own lets the shader do the
    screening, instead of the dots being baked here.

    Solving it is direct rather than iterative. Substituting amp(t) into sheet()
    gives y = A(u) + B(u) * t, which is linear in t, so the t belonging to any
    pixel is just (y - A) / B. No search, no marching.

    Rendered small and scaled up on purpose. It carries no detail above the
    gradient itself, so 1/4 scale costs nothing visible and keeps this in pure
    Python without pulling in numpy.
    """
    w, h = W // 4, H // 4
    img = Image.new("L", (w, h), 0)
    px = img.load()

    for i in range(w):
        u = i / (w - 1)
        sh = shape(u)
        # sheet() with amp(t) expanded and the t terms gathered.
        a = HORIZON * H - 0.045 * H * sh
        b = (H - HORIZON * H) - 0.13 * H * sh
        if abs(b) < 1e-6:
            continue
        across = (1.0 - 0.88 * smoothstep(0.18, 1.02, u)) ** 1.6
        lift = 0.82 + 0.18 * max(0.0, sh)

        for j in range(h):
            y = (j / (h - 1)) * H
            t = (y - a) / b
            if t <= 0.0 or t > 1.0:
                continue
            v = 0.95 * (t ** 0.75) * across * lift
            px[i, j] = int(min(255, max(0, round(v * 255))))

    return img.resize((W, H), Image.LANCZOS)


def main() -> None:
    # Combined with max rather than drawn in sequence: a plain overdraw would
    # let a dim dot punch a hole through a brighter arc underneath it.
    field = ImageChops.lighter(draw_arcs(), draw_dots())
    field = field.resize((W, H), Image.LANCZOS)

    out = Image.merge("RGBA", (
        Image.new("L", (W, H), 255),
        Image.new("L", (W, H), 255),
        Image.new("L", (W, H), 255),
        field,
    ))
    PUB.mkdir(parents=True, exist_ok=True)
    out.save(OUT, "WEBP", quality=80, alpha_quality=72, method=6)
    print(f"wrote {OUT} ({OUT.stat().st_size / 1024:.0f} KB, {W}x{H})")

    src = draw_source().convert("RGB")
    src.save(OUT_SRC, "WEBP", quality=88, method=6)
    print(f"wrote {OUT_SRC} ({OUT_SRC.stat().st_size / 1024:.0f} KB, {W}x{H})")


if __name__ == "__main__":
    main()
