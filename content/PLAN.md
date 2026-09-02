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
| `carousel-offer-more.pdf` | 7 | THE LEAD. Offer more without becoming everything → stay a true expert → together, what neither could alone → one experience, higher value → what it is → messy part disappears → apply |
| `carousel-why-now.pdf` | 6 | Stop competing with AI where it's strongest → customization became cheap → the 6am list + the memory → not the plan, the person → side by side → apply |
| `carousel-collaborating.pdf` | 7 | "Collaborating on INFITRA": split once, design together, one page sells it, one-click live, group stays warm → you bring expertise and audience, we make the collaboration work |
| `carousel-deal.pdf` | 6 | 90%, ZERO to start, no lock-in, 14 days → position yourself early: fixed 10%, founding badge, reviews carry over, top spot at public launch |

Every deck passes the depth principle: no slide reads as "here is what you
lack". The 9 grid squares stay as Instagram story reservoir and single posts.

## Phase 1 — Foundation (~2.5 weeks, one beat every 2-3 days)

| Beat | LinkedIn | Instagram |
|---|---|---|
| 1 | Founder post · POSTED 1 Sep | Profile setup + OFFER MORE carousel · first feed post |
| 2 | OFFER MORE carousel (PDF) · NEXT, ends on "which complement would make your offer complete?" | Single 03 "Not the plan, the person" |
| 3 | WHY NOW carousel | WHY NOW carousel |
| 4 | Single 06 "90%" as text+image post | Single 06 "90%" |
| 5 | COLLABORATING carousel | COLLABORATING carousel |
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

## Founder post (Beat 1, LinkedIn) · posted 1 Sep 2026, final text

> I spent the past year looking closely at digital fitness. This is what
> came out of it:
>
> Fitness moved online and we ended up with more of everything. More apps,
> more programs, more videos, more information than anyone can realistically
> use. The fight for attention just produces another quick hack, another
> secret, another missing piece.
>
> Real results came from more complete guidance, so the trainer handed out
> nutrition plans and the nutritionist handed out workout plans. It made
> sense, and it also turned every offer into a bit of everything.
>
> That broad layer is exactly where AI is now strongest. It switches roles,
> builds the plan, personalises it, remembers the numbers and answers the
> question at 6am, fully coordinated and for almost nothing.
>
> So what still holds value once information and customization are
> basically free?
>
> What is left is depth and human connection. Not one person covering four
> disciplines, but experts who each go all the way in their own craft, on
> the same experience, for the same group.
>
> That's what I'm building with INFITRA. Complementary experts, say a
> strength coach and a nutritionist, build and run a live experience
> together. INFITRA takes care of everything that usually makes
> collaboration hard, from the recorded agreement and the revenue split to
> the joint marketing page, the live sessions and the group engagement in
> between, so each expert can stay fully in their craft and their audiences
> meet instead of compete.
>
> I'm putting together the founding pilot now with the first experts.
>
> If you work in fitness or health, I'd be glad to hear from you. Whether
> you already have someone in mind to build with, or you are just curious
> what it could look like.

## Carousel captions

**OFFER MORE** (LinkedIn document post · link in first comment)
> Yesterday I wrote about why the human part is where value moved. Today,
> what that opens up for every expert who has been pulled into being
> everything for their clients.
>
> Your clients ask for complete guidance. You have deep expertise in one
> field. That was never a problem. It's an opportunity: stay a true expert,
> go deeper into your craft, and bring in someone who does the same in
> theirs.
>
> A strength coach with a nutritionist. A yoga teacher with a women's health
> expert. A sleep coach with a performance coach. One live experience, over
> several weeks, for both audiences.
>
> Seven slides on what you could offer with the right expert beside you.
>
> One question for the experts reading this: which complement would make
> your offer complete? Name it in the comments. I'm building the founding
> pilot on exactly these combinations.

**OFFER MORE** (Instagram first post · 7 PNGs · link in bio = infitra.fit/apply)
> Offer more. Without becoming everything.
>
> Your clients ask for complete guidance. You have deep expertise in one
> field. That's not a problem, it's an opportunity: stay a true expert, and
> bring in someone who does the same in theirs.
>
> Strength + nutrition. Yoga + women's health. Sleep + performance. One live
> experience, several weeks, both audiences.
>
> INFITRA is where complementary experts build it together. Founding pilot
> open, link in bio.
>
> Which complement would make your offer complete?
>
> #fitnesscoach #nutritioncoach #yogateacher #personaltrainer #physiotherapy #infitra

**WHY NOW**
> The personalised plan, the tracking, the answer at 6am: AI does that part
> well now, and it's here to stay. So what still holds value once
> information and customization are basically free? Six slides on why we're
> building INFITRA. More at infitra.fit

**COLLABORATING ON INFITRA**
> Building something with another expert usually gets messy: who owns what,
> who gets paid, who sends the links. Seven slides on how a collaboration
> works on INFITRA, so both of you stay on the content. infitra.fit/apply

**THE DEAL**
> Stated plainly: experts keep 90% of every sale, split as they agree in a
> recorded agreement. CHF 0 to start, no subscription, no lock-in, your
> audience stays yours, payout within 14 days of the experience ending.
> Position yourself early: founding badge that stays, reviews carry over,
> top spot when INFITRA opens publicly. infitra.fit/apply

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
