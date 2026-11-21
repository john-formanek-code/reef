# Tiny ASCII-cell octopus favicon: coral tiles (mantle, eyes, eight arms) on the site's dark tile.
from PIL import Image, ImageDraw
import pathlib
root = pathlib.Path(__file__).resolve().parents[2]
ART = [
"................",
"......####......",
".....######.....",
"....########....",
"....#e####e#....",
"....########....",
".....######.....",
"....#.#..#.#....",
"...#..#..#..#...",
"..#..#....#..#..",
"..#..#....#..#..",
"...#.#....#.#...",
"....#......#....",
"................",
]
H, W = len(ART), 16
off = (16 - H) // 2
BG, CO, MO, EY = "#1a1917", "#e96848", "#9e2e26", "#faecbe"
cells = []
for y, row in enumerate(ART):
    for x, c in enumerate(row):
        if c != ".": cells.append((x, y + off, c))
svg = ['<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" shape-rendering="crispEdges">', f'<rect width="16" height="16" rx="3" fill="{BG}"/>']
for x, y, c in cells:
    col = EY if c == "e" else (CO if y < 8 + off - 1 else "#d9553b")
    svg.append(f'<rect x="{x+.06:.2f}" y="{y+.06:.2f}" width=".88" height=".88" fill="{col}"/>')
svg.append("</svg>")
(root / "favicon.svg").write_text("".join(svg))
def png(size, name, pad=0):
    s = 16 + pad * 2
    im = Image.new("RGBA", (s * 40, s * 40), (0, 0, 0, 0)); d = ImageDraw.Draw(im)
    d.rounded_rectangle([0, 0, s * 40 - 1, s * 40 - 1], radius=3 * 40 if not pad else 0, fill=BG)
    for x, y, c in cells:
        col = EY if c == "e" else (CO if y < 8 + off - 1 else "#d9553b")
        d.rectangle([(x + pad) * 40 + 2, (y + pad) * 40 + 2, (x + pad) * 40 + 37, (y + pad) * 40 + 37], fill=col)
    im.resize((size, size), Image.LANCZOS).save(root / name)
png(32, "favicon-32.png"); png(180, "apple-touch-icon.png", pad=2)
print(len(cells))
