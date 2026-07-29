# INFITRA social posts

On-brand graphics rendered from HTML, using the real brand tokens, the real
General Sans webfont, and the site's actual background component. Nothing is
approximated, so posts match the product visually by construction.

Voice, vocabulary and colour tokens live in `../BRAND.md`.

## Make a post

1. Add an entry to `POSTS` in `build_posts.py`
2. Generate and render:

```bash
python3 content/build_posts.py
./content/render.sh posts/<slug> 1080 1080 content/out/<slug>.png
```

Render everything at once:

```bash
python3 content/build_posts.py
for f in content/templates/posts/*.html; do
  s=$(basename "$f" .html)
  ./content/render.sh "posts/$s" 1080 1080 "content/out/$s.png"
done
```

Captions for the launch grid are in `captions.md`.

## Files

| File | Role |
|---|---|
| `build_posts.py` | **The single source.** Post copy as data, plus the two background definitions. Edit here. |
| `templates/_brand.css` | Shared layout and brand layer. Type scale, logo lockup, dark variant. |
| `templates/posts/*.html` | Generated. Do not hand-edit, `build_posts.py` overwrites them. |
| `render.sh` | Renders a template through headless Chrome at 2x, downsamples to exact size. |
| `out/` | Rendered PNGs. Gitignored, regenerate any time. |

## Two things that will bite you if you change the background

Both cost real debugging time. The current setup works because of them.

**1. Fit the waves with `preserveAspectRatio="xMidYMid slice"`, never `"none"`.**
The band paths in `WaveFlowingBackground.tsx` are authored for a wide
viewport. Stretched into a square with `none`, they terminate mid-frame and
leave a hard edge. `slice` crops a window of the wide composition instead, so
bands sweep through and keep their designed curvature.

**2. Blur the back band with CSS `filter: blur()`, never SVG `feGaussianBlur`.**
Chrome clips the SVG filter surface, which leaves a hard horizontal seam that
survives even a 42px blur. This was the cause of the seam, not the geometry.

If a background edit ever produces a straight line across the frame, it is one
of these two.

## Sizes

`render.sh` takes width and height, so any format works:

- `1080 1080` Instagram square
- `1080 1350` Instagram portrait, carousel slides
- `1080 1920` Stories and Reels covers
- `1200 630` Open Graph and link previews

Type is sized in `px` against a `--w` token, so very different aspect ratios
may want a tweak to `--pad` and the headline `fs`.
