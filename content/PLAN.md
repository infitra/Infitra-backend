# INFITRA content strategy — one storyline, two surfaces

LinkedIn and Instagram tell the SAME story on the same days; only format
differs. LinkedIn: text-led founder posts + PDF document carousels.
Instagram: identical slides as PNG swipe posts + daily stories from the grid
reservoir. Voice and vocabulary from BRAND.md.

Language doctrine (1 Sep): **complementary experts, plural and unbounded.**
A duo (strength coach + nutritionist) is an illustration, never the
definition. **No public counts** for the pilot ("the founding pilot is
open", never "five pairs"): a public number is a countable failure state
pre-traction.

The arc: **foundation → proof → momentum → learnings → next phase.**
From Phase 2 the flywheel inverts: experts post, INFITRA reposts. Their
audiences are the distribution, ours is the archive.

---

## The three tools

| Tool | What it is | When |
|---|---|---|
| **Founder post** | Text-led, first person, one strong image at most | Openings, announcements, learnings |
| **Carousel** | 6-8 slide deck answering ONE question | Education (the series below) |
| **Single square** | One grid statement + short caption | Rhythm keeper between beats, IG stories |

## The carousel series

Four decks in `build_posts.py` under `CAROUSELS`, ordered by the BRAND.md
messaging architecture: opportunity first, infrastructure as objection
killer, never as headline. All light; waves mirror every second slide so the
deck reads as one ribbon; orange accents only. Rebuild:

    python3 content/build_posts.py
    for f in content/templates/carousel/*.html; do s=$(basename "$f" .html); \
      ./content/render.sh "carousel/$s" 1080 1080 "content/out/carousel/$s.png"; done
    python3 content/make_carousels.py

| Deck | Slides | Job |
|---|---|---|
| `carousel-offer-more.pdf` | 6 | THE LEAD. Offer more without becoming everything → don't become the nutritionist → concrete duos → what it is → messy part disappears |
| `carousel-why-now.pdf` | 6 | The AI shift: why the human part is where value moved |
| `carousel-handled.pdf` | 7 | The infrastructure as objection killer: split once, design together, one page sells it, one-click live, group stays warm |
| `carousel-deal.pdf` | 6 | What it costs, what you keep: 90%, CHF 0 to start, no lock-in, 14 days |

Every deck passes the depth principle: no slide reads as "here is what you
lack". The 9 grid squares stay as Instagram story reservoir and single posts.

## Phase 1 — Foundation (~2.5 weeks, one beat every 2-3 days)

| Beat | LinkedIn | Instagram |
|---|---|---|
| 1 | Founder post (below) | Profile setup + OFFER MORE carousel |
| 2 | OFFER MORE carousel (PDF) | Single 03 "Not the plan, the person" |
| 3 | WHY NOW carousel | WHY NOW carousel |
| 4 | Single 06 "90%" as text+image post | Single 06 "90%" |
| 5 | HANDLED carousel | HANDLED carousel |
| 6 | THE DEAL carousel | THE DEAL carousel |
| 7 | Founder post: what recruiting founding experts is teaching me | Single 09 "The founding pilot. Open now." |

Stories daily from the 9-square reservoir. Profile must be alive BEFORE each
outreach wave sends.

## Phases 2-5 (unchanged in spirit)

- **2 · Proof**: expert intro cards + pair announcements on first yes (real
  photos with permission; never stock, never AI people). Experts post to
  their audiences, INFITRA reposts.
- **3 · Momentum**: experience announcements with marketing-page links,
  founder build-in-public notes.
- **4 · Learnings**: weekly observation from inside running experiences
  (with consent); retro per ended experience, lead with what the pair kept.
- **5 · Next phase**: applications for the next cohort, pilot results as
  the pitch.

---

## Founder post (Beat 1, LinkedIn)

> Something I keep coming back to: AI has quietly become very good at the
> part that used to sit at the centre of a fitness product. The
> personalised plan, the tracking, the answer at 6am. It's genuinely useful
> and it's here to stay.
>
> So the honest question for anyone selling coaching online is what still
> holds value once information and customization are basically free.
>
> I think it's the part a model can't hand you. Real guidance from someone
> who has seen your situation before, complementary expertise in the same
> room, and a group that notices when you stop showing up.
>
> And it opens something for every expert who has been pulled into being
> everything for their clients: offer more without becoming everything.
> Don't become the nutritionist, partner with one.
>
> That's what I'm building INFITRA for. Complementary experts, say a
> strength coach and a nutritionist, design and run one live experience
> together over four to six weeks, online, each going all in on their own
> craft. They keep 90% of every sale, split as they agree in a recorded
> agreement, and their audiences stay entirely their own.
>
> The founding pilot is open now. Pricing in CHF, no upfront cost and
> no subscription.
>
> If you're a coach, nutritionist, physio or movement teacher and this
> sounds like your kind of thing, send me a message. And if you know
> someone it fits better than you, I'd happily take that introduction.

## Carousel captions

**OFFER MORE**
> Your clients want complete guidance, and you are one specialist. That is
> not a problem to fix. Don't become the nutritionist: partner with one, and
> go all in on your own craft. Six slides on what you could offer with the
> right expert beside you. infitra.fit

**WHY NOW**
> The personalised plan, the tracking, the answer at 6am: AI does that part
> well now, and it's here to stay. So what still holds value once
> information and customization are basically free? Six slides on why we're
> building INFITRA. More at infitra.fit

**HANDLED**
> Building something with another expert usually gets messy: who owns what,
> who gets paid, who sends the links. Seven slides on how INFITRA makes that
> part disappear, so both of you stay on the content. infitra.fit

**THE DEAL**
> Stated plainly: experts keep 90% of every sale, split as they agree in a
> recorded agreement. CHF 0 to start, no subscription, no lock-in, your
> audience stays yours, payout within 14 days of the experience ending.
> Founding terms, locked for the duration of the pilot: infitra.fit

---

## Open (session 2 Sep)

- **Slide-by-slide copy review of all four decks.** Copy is NOT final.
  Known example of the failure mode to hunt for: "You carry the parts
  you're actually great at" (why-together 4) reads as "you can't do this
  alone / you're incapable". Frame collaboration as amplifying a complete
  professional, never as compensating a deficit.
- **The comprehension gap (learned 1 Sep from Michael Bachmann's reply).**
  The HOW deck explains mechanics but never shows what a participant
  actually buys: online, over video, several weeks, one purchase, both
  experts leading live sessions, group space in between. Add that picture
  early in the deck, and gloss "Live-Erlebnis"/"Tribe Space" for cold
  readers who have never heard of INFITRA.
- Instagram slide set updates follow whatever the review changes.
- Posting timing: exact days/times per beat, and the strategy for the gaps
  between beats (follow-up storyline, stories cadence, founder interludes).
