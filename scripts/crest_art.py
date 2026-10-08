"""Split the BAUST crest SVG into animatable shapes for the landing intro.

    python3 scripts/crest_art.py assets/baust-crest.svg src/pages/intro/crestArt.ts

The supplied crest is eight compound paths, one per colour, each holding many sub-paths with
even-odd holes (the counters of letters, the inside of the gear ring). Splitting naively at every
"M" would turn each hole into a filled shape, so sub-paths are grouped into islands instead: a
sub-path belongs to the smallest sub-path whose outline contains it, and every top-level outline
plus everything nested inside it becomes one island that still renders correctly with even-odd fill.
"""
import json
import re
import sys

NUM = r"-?\d*\.?\d+(?:e-?\d+)?"


def subpaths(d):
    """Yield each absolute M...Z sub-path as a list of (command, numbers)."""
    for chunk in re.findall(r"M[^M]*", d):
        cmds = []
        for letter, args in re.findall(r"([MLCZ])([^MLCZ]*)", chunk):
            cmds.append((letter, [float(n) for n in re.findall(NUM, args)]))
        yield cmds


def polygon(cmds, steps=6):
    """Approximate the outline as points, sampling each cubic Bezier."""
    pts, cur = [], (0.0, 0.0)
    for letter, n in cmds:
        if letter in "ML":
            cur = (n[0], n[1])
            pts.append(cur)
        elif letter == "C":
            for i in range(0, len(n), 6):
                p0, p1, p2, p3 = cur, (n[i], n[i + 1]), (n[i + 2], n[i + 3]), (n[i + 4], n[i + 5])
                for s in range(1, steps + 1):
                    t = s / steps
                    u = 1 - t
                    x = u**3 * p0[0] + 3 * u * u * t * p1[0] + 3 * u * t * t * p2[0] + t**3 * p3[0]
                    y = u**3 * p0[1] + 3 * u * u * t * p1[1] + 3 * u * t * t * p2[1] + t**3 * p3[1]
                    pts.append((x, y))
                cur = p3
    return pts


def inside(pt, poly):
    x, y = pt
    hit = False
    j = len(poly) - 1
    for i in range(len(poly)):
        xi, yi = poly[i]
        xj, yj = poly[j]
        if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi + 1e-12) + xi:
            hit = not hit
        j = i
    return hit


def area(poly):
    a = 0.0
    for i in range(len(poly)):
        x1, y1 = poly[i]
        x2, y2 = poly[(i + 1) % len(poly)]
        a += x1 * y2 - x2 * y1
    return abs(a) / 2


def fmt(v):
    # Whole crest units: at the largest size the intro draws (about 340px tall) one unit is a third of a pixel.
    return str(round(v))


def serialize(cmds):
    out = []
    for letter, n in cmds:
        out.append(letter + " ".join(fmt(v) for v in n))
    return "".join(out)


def islands(d):
    subs = list(subpaths(d))
    polys = [polygon(c) for c in subs]
    areas = [area(p) for p in polys]
    parent = []
    for i, p in enumerate(polys):
        best = None
        # a sub-path sits inside another when a point of its outline is inside that outline
        probe = p[len(p) // 3]
        for j, q in enumerate(polys):
            if i != j and areas[j] > areas[i] and inside(probe, q):
                if best is None or areas[j] < areas[best]:
                    best = j
        parent.append(best)

    def root(i):
        while parent[i] is not None:
            i = parent[i]
        return i

    groups = {}
    for i in range(len(subs)):
        groups.setdefault(root(i), []).append(i)
    result = []
    for r, members in groups.items():
        xs = [x for m in members for x, _ in polys[m]]
        ys = [y for m in members for _, y in polys[m]]
        result.append({
            "d": "".join(serialize(subs[m]) for m in sorted(members)),
            "outer": serialize(subs[r]),
            "box": [round(min(xs)), round(min(ys)), round(max(xs) - min(xs)), round(max(ys) - min(ys))],
            "area": round(areas[r]),
            "parts": len(members),
        })
    return result


def group(layers):
    """Name the crest's parts by where they sit (the source is a colour-traced vector)."""
    by = {layer["id"]: layer for layer in layers}

    def isl(layer_id):
        return sorted(by[layer_id]["islands"], key=lambda i: -i["area"])

    def cx(i):
        return i["box"][0] + i["box"][2] / 2

    def cy(i):
        return i["box"][1] + i["box"][3] / 2

    green, yellow, white, orange = isl("green"), isl("yellow"), isl("white"), isl("orange")
    ring, swords = yellow[0], next(i for i in yellow if cy(i) < 200 and i is not yellow[0])
    letters = [i for i in yellow if i is not ring and i is not swords]
    name = [i for i in letters if 240 <= i["box"][0] and cx(i) < 810 and cy(i) < 740]
    motto = [i for i in letters if i not in name]
    fills = {layer["id"]: layer["fill"] for layer in layers}

    def part(layer_id, islands, order=None, solid=False):
        islands = sorted(islands, key=order) if order else islands
        return [{"fill": fills[layer_id], "d": i["outer"] if solid else i["d"]} for i in islands]

    navy = isl("navy")[0]
    return {
        # Every hole in the shield and ribbon sits under another colour (the gear, the lettering, the
        # lotus), so they are drawn solid: each part then arrives on unbroken green instead of into a
        # visible cut-out, and the finished crest is unchanged.
        "shield": part("green", green[:1], solid=True),
        "ribbon": part("green", green[1:], solid=True),
        "gear": part("navy", [navy]) + part("yellow", [ring]),
        "buildings": part("red", isl("red"), cx) + part("orange", [i for i in orange if cy(i) > 300], cx),
        # the white band is the pulse line's outline, so it runs with the line
        "pulse": part("white", [white[0]]) + part("cyan", isl("cyan")),
        "emblem": part("yellow", [swords]) + part("white", white[1:]) + part("orange", [i for i in orange if cy(i) <= 300]),
        "name": part("yellow", name, cx),
        "motto": part("yellow", motto, cx),
        "year": part("black", isl("black"), cx),
    }, (round(navy["box"][0] + navy["box"][2] / 2), round(navy["box"][1] + navy["box"][3] / 2))


def main(src, out):
    svg = open(src, encoding="utf-8").read()
    view_box = re.search(r'viewBox="([^"]+)"', svg).group(1)
    layers = []
    for m in re.finditer(r'<path[^>]*id="([^"]+)"[^>]*fill="([^"]+)"[^>]*d="([^"]*)"', svg):
        layer_id, fill, d = m.groups()
        layers.append({"id": layer_id, "fill": fill, "islands": islands(d)})
    parts, gear_center = group(layers)
    lines = [
        "// Generated by scripts/crest_art.py from assets/baust-crest.svg. Do not edit by hand.",
        "// The BAUST crest, split into the parts the landing intro animates. Paths use even-odd fill.",
        "// BAUST's name and crest are not covered by this repository's licence.",
        "",
        "export type CrestShape = { fill: string; d: string };",
        f'export const CREST_VIEWBOX = "{view_box}";',
        f"/** Centre of the gear in crest units, for turning it about its own axle. */",
        f"export const GEAR_CENTER = {{ x: {gear_center[0]}, y: {gear_center[1]} }};",
        "",
        "export const CREST = {",
    ]
    for key, shapes in parts.items():
        lines.append(f"  {key}: [")
        for shape in shapes:
            lines.append(f'    {{ fill: "{shape["fill"]}", d: "{shape["d"]}" }},')
        lines.append("  ],")
    lines.append("} satisfies Record<string, CrestShape[]>;")
    lines.append("")
    open(out, "w", encoding="utf-8").write("\n".join(lines))
    for key, shapes in parts.items():
        print(f"{key:10s} {len(shapes):3d} shapes")


if __name__ == "__main__":
    main(sys.argv[1], sys.argv[2])
