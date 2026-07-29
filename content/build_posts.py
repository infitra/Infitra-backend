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
    <svg class="waves" viewBox="0 0 1080 1080" preserveAspectRatio="none">
      <defs>
        <linearGradient id="w1" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stop-color="#7FD8F0" stop-opacity="{o1}"/>
          <stop offset="55%" stop-color="#7FD8F0" stop-opacity=".10"/>
          <stop offset="100%" stop-color="#FF6130" stop-opacity="0"/>
        </linearGradient>
        <linearGradient id="w2" x1="0" y1="1" x2="1" y2="0">
          <stop offset="0%" stop-color="#FF6130" stop-opacity="0"/>
          <stop offset="65%" stop-color="#FF6130" stop-opacity=".14"/>
          <stop offset="100%" stop-color="#FF6130" stop-opacity="{o2}"/>
        </linearGradient>
      </defs>
      <path d="M-60 980 C 200 880, 420 960, 660 800 C 850 672, 980 700, 1160 560 L1160 1160 L-60 1160 Z" fill="url(#w1)"/>
      <path d="M-60 200 C 220 320, 520 120, 720 190 C 900 252, 1020 120, 1160 -40 L1160 -120 L-60 -120 Z" fill="url(#w2)"/>
    </svg>

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
        # waves sit back on dark so the type stays dominant
        o1=".22" if dark else ".55",
        o2=".20" if dark else ".38",
    )
    (out / f"{p['slug']}.html").write_text(html)
    print(f"pillar {p['pillar']}  {p['slug']}.html")

print(f"\n{len(POSTS)} templates written to {out}")
