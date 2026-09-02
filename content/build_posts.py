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
         head='The founding pilot.<br><span class="accent">Open now.</span>',
         sub="Complementary experts running the first live experiences on INFITRA. More at infitra.fit",
         fs=96),
]

# The real INFITRA background, ported verbatim from
# web/app/components/WaveFlowingBackground.tsx: three diagonal bands running
# lower-left to upper-right, filled with the cyan -> white -> orange brand
# gradient, back layer blurred. Same viewBox (1600x1000) stretched onto the
# square with preserveAspectRatio="none", exactly as the site does on portrait
# phones, so the diagonal reads steeper and more dramatic.
# The real INFITRA background, faithful port of WaveFlowingBackground.tsx.
#
# Two problems had to be solved to make it work in a square:
#  1. preserveAspectRatio="none" stretched the bands and made them terminate
#     mid-frame, because these paths are authored for a wide viewport.
#     "xMidYMid slice" instead COVERS the square (like background-size:cover),
#     cropping the sides, so the bands sweep across without ending in frame
#     and keep their designed curvature.
#  2. The back layer's SVG feGaussianBlur got its filter surface clipped by
#     Chrome, leaving a hard seam that survived even a 42px blur. Using a CSS
#     filter on the wrapping element instead has no such clip.
#
# Each band is its own <svg> so the back one can be blurred independently.
WAVES_LIGHT = """<div class="waves">
      <svg class="wv wv1" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="f1" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#9CF0FF" stop-opacity="0.92"/>
            <stop offset="35%" stop-color="#9CF0FF" stop-opacity="0.62"/>
            <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.40"/>
            <stop offset="65%" stop-color="#FF6130" stop-opacity="0.62"/>
            <stop offset="100%" stop-color="#FF6130" stop-opacity="0.92"/>
          </linearGradient>
        </defs>
        <path d="M -400 1700 C 100 1300, 500 1500, 900 1100 C 1300 700, 1700 950, 2100 -400 L 2100 -1400 C 1700 -200, 1300 -500, 900 -100 C 500 300, 100 50, -400 600 Z" fill="url(#f1)"/>
      </svg>
      <svg class="wv wv2" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="f2" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#9CF0FF" stop-opacity="0.92"/>
            <stop offset="35%" stop-color="#9CF0FF" stop-opacity="0.62"/>
            <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.40"/>
            <stop offset="65%" stop-color="#FF6130" stop-opacity="0.62"/>
            <stop offset="100%" stop-color="#FF6130" stop-opacity="0.92"/>
          </linearGradient>
        </defs>
        <path d="M -300 1500 C 150 1180, 500 1330, 850 980 C 1200 620, 1550 800, 1950 -300 L 1950 -1000 C 1550 -50, 1200 -250, 850 100 C 500 460, 150 250, -300 720 Z" fill="url(#f2)"/>
      </svg>
      <svg class="wv wv3" viewBox="0 0 1600 1000" preserveAspectRatio="xMidYMid slice">
        <defs>
          <linearGradient id="f3" x1="0%" y1="100%" x2="100%" y2="0%">
            <stop offset="0%" stop-color="#9CF0FF" stop-opacity="1"/>
            <stop offset="50%" stop-color="#FFFFFF" stop-opacity="0.75"/>
            <stop offset="100%" stop-color="#FF6130" stop-opacity="1"/>
          </linearGradient>
        </defs>
        <path d="M -200 1300 C 150 1020, 480 1180, 820 880 C 1160 580, 1480 740, 1800 -100 L 1800 -550 C 1480 250, 1160 80, 820 380 C 480 680, 150 520, -200 880 Z" fill="url(#f3)"/>
      </svg>
    </div>"""

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

# ── Carousels ────────────────────────────────────────────────────────────
# Four decks following the BRAND.md messaging architecture, in posting order:
#   offer-more  the lead: tension -> opportunity -> what it is -> handled
#   why-now     the AI shift, the context that makes it urgent
#   handled     the infrastructure as objection killer, never as headline
#   deal        what it costs, what you keep
# All light theme; every second slide mirrors the waves so the deck reads as
# one ribbon. Counter top-right, series as eyebrow. Orange accents only.
# Depth principle: the complement releases you deeper into your craft; no
# slide may read as "here is what you lack".
# Render slides, then assemble PDFs: python3 content/make_carousels.py

CAROUSELS = {
    "offer-more": dict(series="Offer more", slides=[
        dict(head='Offer more.<br>Without becoming<br><span class="accent">everything.</span>',
             sub="Your clients want complete guidance. You are one specialist. That is not a problem to fix.", fs=96),
        dict(head='Don\'t become<br>the <span class="accent">nutritionist.</span>',
             sub="Partner with one. The strength coach stays a strength coach, the nutrition half gets a real expert, and the client gets both at full depth.", fs=104),
        dict(head='Strength + nutrition.<br>Yoga + women\'s health.<br>Physio + <span class="accent">performance.</span>',
             sub="Two specialists, one experience. Each goes deeper into their own craft because the other half is in good hands.", fs=76),
        dict(head='Several weeks.<br>Live. <span class="accent">Together.</span>',
             sub="It runs online. Participants buy once, meet the experts live on video across the weeks, and stay connected in a shared space in between.", fs=100),
        dict(head='The messy part<br><span class="accent">disappears.</span>',
             sub="Agreement, revenue split, checkout, live rooms, group space: INFITRA handles everything around the experience. You bring the expertise.", fs=104),
        dict(head='The founding pilot.<br><span class="accent">Open now.</span>',
             sub="Experts keep 90% of every sale. More at infitra.fit", fs=96),
    ]),
    "why-now": dict(series="Why INFITRA", slides=[
        dict(head='The plan<br>just became <span class="accent">free.</span>',
             sub="AI changed what a fitness product is worth. Here is what that means for everyone who coaches for a living.", fs=104),
        dict(head='More apps.<br>More programs.<br><span class="accent">More noise.</span>',
             sub="Fitness moved online and we ended up with more of everything. Information was never the missing piece.", fs=100),
        dict(head='The plan. The tracking.<br><span class="accent">The answer at 6am.</span>',
             sub="AI does this part well now. It's genuinely useful and it's here to stay. And it's not where your value is.", fs=80),
        dict(head='Not the plan,<br><span class="accent">the person.</span>',
             sub="Real guidance, accountability, and a group worth belonging to. The things a model can't hand you.", fs=116),
        dict(head='Real experts,<br><span class="accent">side by side.</span>',
             sub="Complementary experts run one live experience together, online, over several weeks. Real people, live, with a group that keeps showing up.", fs=104),
        dict(head='The founding pilot.<br><span class="accent">Open now.</span>',
             sub="Experts keep 90% of every sale. More at infitra.fit", fs=96),
    ]),
    "handled": dict(series="The messy part, handled", slides=[
        dict(head='Building together<br>usually gets<br><span class="accent">messy.</span>',
             sub="Who owns what, who gets paid, who sends the links. Here is how INFITRA makes that part disappear.", fs=92),
        dict(head='Agree the split.<br><span class="accent">Once.</span>',
             sub="The revenue split is recorded before anything sells. Experts keep 90% of every sale, divided as you agree. No awkward money talk later.", fs=104),
        dict(head='Design it<br><span class="accent">together.</span>',
             sub="One shared workspace for the whole experience: the weeks, the sessions, the materials. You build together, nothing gets lost in chat threads.", fs=116),
        dict(head='One page<br><span class="accent">sells it.</span>',
             sub="Your experience gets its own marketing page with checkout. No funnel to build, no website project.", fs=116),
        dict(head='Go live in<br><span class="accent">one click.</span>',
             sub="Participants purchase once and join every live session in one click. You show up and coach, the room is handled.", fs=116),
        dict(head='The group<br>stays <span class="accent">warm.</span>',
             sub="Between sessions, participants check in, ask you questions directly and reflect after each session. Built in, not bolted on.", fs=116),
        dict(head='You bring the expertise.<br>We bring the <span class="accent">rest.</span>',
             sub="Nothing to build, nothing to pay upfront. The founding pilot is open: infitra.fit", fs=90),
    ]),
    "deal": dict(series="The deal", slides=[
        dict(head='The deal,<br>stated <span class="accent">plainly.</span>',
             sub="What it costs to run a live experience on INFITRA, and what you keep.", fs=104),
        dict(head='Keep <span class="accent">90%</span><br>of every sale.',
             sub="Split between collaborators as you agree, in a recorded agreement. INFITRA's founding fee is the remaining 10%, locked for the duration of the pilot.", fs=110),
        dict(head='CHF <span class="accent">0</span> to start.',
             sub="No upfront cost, no subscription, no minimum. You pay nothing to build and publish an experience.", fs=124),
        dict(head='No <span class="accent">lock-in.</span>',
             sub="Your audience and your clients stay entirely yours, during and after. No exclusivity, no tie-in, leave any time.", fs=124),
        dict(head='Paid within<br><span class="accent">14 days.</span>',
             sub="Payout lands within 14 days of your experience ending, per the recorded split.", fs=110),
        dict(head='Good terms,<br>on <span class="accent">purpose.</span>',
             sub="Founding terms, locked for the duration of the pilot. The pilot is open: infitra.fit", fs=104),
    ]),
}

CTPL = """<!doctype html>
<html>
<head>
<meta charset="utf-8">
<link rel="stylesheet" href="https://api.fontshare.com/v2/css?f[]=general-sans@500,700&display=swap">
<link rel="stylesheet" href="../_brand.css">
<style>
  :root {{ --w: 1080px; --h: 1080px; --pad: 88px; --mark: 62px; }}
  .stage {{ background: var(--cream); }}
  h1 {{ font-size: {fs}px; }}
  .eyebrow {{ font-size: calc(var(--w) * 0.0225); }}
  .sub {{ font-size: calc(var(--w) * 0.035); color: #3D4E5C; }}
  .flip .wv {{ transform: scaleX(-1); }}
  .count {{
    position: absolute; top: var(--pad); right: var(--pad); z-index: 2;
    font-weight: 700; letter-spacing: 0.12em;
    font-size: calc(var(--w) * 0.019); color: var(--muted);
  }}
</style>
</head>
<body>
  <div class="stage {flip}">
    {waves}
    <span class="count">{idx} / {total}</span>
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

cout = pathlib.Path(__file__).parent / "templates" / "carousel"
cout.mkdir(parents=True, exist_ok=True)
for key, c in CAROUSELS.items():
    total = len(c["slides"])
    for i, sl in enumerate(c["slides"], 1):
        html = CTPL.format(fs=sl["fs"], flip="flip" if i % 2 == 0 else "",
                           waves=WAVES_LIGHT, idx=i, total=total,
                           eyebrow=c["series"], head=sl["head"], sub=sl["sub"])
        (cout / f"{key}-{i:02d}.html").write_text(html)
    print(f"carousel {key}: {total} slides")
