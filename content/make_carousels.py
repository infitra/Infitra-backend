#!/usr/bin/env python3
"""Assemble rendered carousel slides into per-deck PDFs for LinkedIn.
Run after build_posts.py + render.sh. Instagram uses the PNGs directly."""
import glob, os, re
from PIL import Image

slides = sorted(glob.glob("content/out/carousel/*.png"))
decks = {}
for f in slides:
    key = re.sub(r'-\d+\.png$', '', os.path.basename(f))
    decks.setdefault(key, []).append(f)
for key, files in decks.items():
    imgs = [Image.open(f).convert("RGB") for f in sorted(files)]
    out = f"content/out/carousel-{key}.pdf"
    imgs[0].save(out, save_all=True, append_images=imgs[1:], resolution=96)
    print(out, f"{os.path.getsize(out)/1e6:.1f} MB", len(imgs), "slides")
