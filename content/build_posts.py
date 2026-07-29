#!/usr/bin/env python3
"""
Generate INFITRA social posts as HTML, ready for content/render.sh.

Add a post by appending to POSTS below, then:

    python3 content/build_posts.py
    ./content/render.sh posts/01-ai-plan 1080 1080 content/out/01.png

Fields:
  slug     output filename (content/templates/posts/<slug>.html)
  theme    "light" (cream) or "dark" (teal)
  eyebrow  small uppercase kicker
  head     headline HTML. <br> for line breaks, <span class="accent">
           for orange, <span class="accent-cyan"> for cyan
  sub      supporting line, plain text
  fs       headline font size in px, tune so lines don't wrap awkwardly
  pillar   1 the shift · 2 the model · 3 the build (grouping only)
"""
import pathlib

POSTS = [
    # ── Pillar 1 · The shift ──────────────────────────────────────────
    dict(slug="01-plan-room", pillar=1, theme="light", eyebrow="The shift",
         head='AI can write<br>the plan.<br><span class="accent">It can\'t hold<br>the room.</span>',
         sub="The next era of fitness isn't another library of content. It's experiences people take part in.",
         fs=104),
    dict(slug="02-more-noise", pillar=1, theme="dark", eyebrow="The shift",
         head='More apps.<br>More programs.<br><span class="accent">More noise.</span>',
         sub="Fitness moved online and we ended up with more of everything. Information was never the missing piece.",
         fs=104),
    dict(slug="03-person", pillar=1, theme="light", eyebrow="The shift",
         head='Not the plan,<br><span class="accent">the person.</span>',
         sub="Once information and customization are basically free, what still holds value is the human part.",
         fs=118),

    # ── Pillar 2 · The model ──────────────────────────────────────────
    dict(slug="04-two-build", pillar=2, theme="dark", eyebrow="How it works",
         head='One expert<br>builds alone.<br><span class="accent">Two build<br>something better.</span>',
         sub="A strength coach and a nutritionist, one live experience, designed together.",
         fs=94),
    dict(slug="05-pairing", pillar=2, theme="light", eyebrow="How it works",
         head='Strength coach<br>+ nutritionist.<br><span class="accent-cyan">One live<br>experience.</span>',
         sub="Complementary experts, four to six weeks, built together in one workspace.",
         fs=94),
    dict(slug="06-ninety", pillar=2, theme="dark", eyebrow="The deal",
         head='Experts keep<br><span class="accent">90%</span><br>of revenue.',
         sub="No upfront cost, no subscription, no lock-in. Your audience stays entirely yours.",
         fs=112),

    # ── Pillar 3 · The build ──────────────────────────────────────────
    dict(slug="07-tribe", pillar=3, theme="light", eyebrow="The tribe space",
         head='The room<br>your tribe<br><span class="accent-cyan">lives in.</span>',
         sub="Where participants stay connected between sessions. Not a feed. A room with your people in it.",
         fs=112),
    dict(slug="08-one-click", pillar=3, theme="dark", eyebrow="One click",
         head='From agreement<br>to <span class="accent">live.</span>',
         sub="Marketing page, checkout, live rooms, tribe space, revenue split. INFITRA handles everything around your experience.",
         fs=104),
    dict(slug="09-founding", pillar=3, theme="light", eyebrow="Founding pilot",
         head='Five founding pairs.<br><span class="accent">Starting now.</span>',
         sub="Complementary experts running the first live experiences on INFITRA. More at infitra.fit",
         fs=96),
]

# The real INFITRA background, ported verbatim from
# web/app/components/WaveFlowingBackground.tsx: three diagonal bands running
# lower-left to upper-right, filled with the cyan -> white -> orange brand
# gradient, back layer blurred. Same viewBox (1600x1000) stretched onto the
# square with preserveAspectRatio="none", exactly as the site does on portrait
# phones, so the diagonal reads steeper and more dramatic.
WAVES_LIGHT = ""  # light background is pure CSS, see _brand.css

# Dark stage: same paths, gradients pulled right down so the teal stays
# dominant and light type keeps its contrast.
WAVES_DARK = """<svg class="waves" viewBox="0 0 1600 1000" preserveAspectRatio="none">
      <defs>
        <linearGradient id="d1" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#9CF0FF" stop-opacity="0.10"/>
          <stop offset="40%" stop-color="#9CF0FF" stop-opacity="0.045"/>
          <stop offset="52%" stop-color="#0C262E" stop-opacity="0"/>
          <stop offset="64%" stop-color="#FF6130" stop-opacity="0.05"/>
          <stop offset="100%" stop-color="#FF6130" stop-opacity="0.11"/>
        </linearGradient>
        <linearGradient id="d2" x1="0%" y1="100%" x2="100%" y2="0%">
          <stop offset="0%" stop-color="#9CF0FF" stop-opacity="0.07"/>
          <stop offset="50%" stop-color="#0C262E" stop-opacity="0"/>
          <stop offset="100%" stop-color="#FF6130" stop-opacity="0.07"/>
        </linearGradient>
      </defs>
      <g filter="url(#wash)">
      <path d="M -400 1700 C 100 1300, 500 1500, 900 1100 C 1300 700, 1700 950, 2100 -400 L 2100 -1400 C 1700 -200, 1300 -500, 900 -100 C 500 300, 100 50, -400 600 Z" fill="url(#d1)"/>
      <path d="M -200 1300 C 150 1020, 480 1180, 820 880 C 1160 580, 1480 740, 1800 -100 L 1800 -550 C 1480 250, 1160 80, 820 380 C 480 680, 150 520, -200 880 Z" fill="url(#d2)"/>
    </svg>"""

TPL = """<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=general-sans@500,700&display=swap">
<link rel="stylesheet" href="../_brand.css">
<style>
  :root {{ --w: 1080px; --h: 1080px; --pad: 88px; --mark: 62px; }}
  .stage {{ background: var(--cream); }}
  h1 {{ font-size: {fs}px; }}
</style>
</head>
<body>
  <div class="stage {theme}">
    {waves}

    <div class="body">
      <p class="eyebrow">{eyebrow}</p>
      <h1>{head}</h1>
      <p class="sub">{sub}</p>
    </div>

    <div class="brand">
      <img src="../../../web/public/logo-mark.png" alt="">
      <span>INFITRA</span>
    </div>
  </div>
</body>
</html>
"""

out = pathlib.Path(__file__).parent / "templates" / "posts"
out.mkdir(parents=True, exist_ok=True)

for p in POSTS:
    dark = p["theme"] == "dark"
    html = TPL.format(
        fs=p["fs"],
        theme="dark" if dark else "",
        eyebrow=p["eyebrow"],
        head=p["head"],
        sub=p["sub"],
        waves=WAVES_DARK if dark else WAVES_LIGHT,
    )
    (out / f"{p['slug']}.html").write_text(html)
    print(f"pillar {p['pillar']}  {p['slug']}.html")

print(f"\n{len(POSTS)} templates written to {out}")
