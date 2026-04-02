import Image from "next/image";
import Link from "next/link";
import { Accordion } from "./components/Accordion";
import { NetworkLoop } from "./components/NetworkLoop";
import { MasterAccordion } from "./components/MasterAccordion";

export default function LandingPage() {
  const accordionItems = [
    {
      title: "The INFITRA Network Loop",
      content: <NetworkLoop />,
    },
    {
      title: "The Collaboration Engine",
      content: (
        <div className="space-y-4">
          <p>Every collaboration on INFITRA is contract-backed from the start. Before anything goes live, revenue splits, session ownership, and terms are defined and locked in — automatically enforced by the platform.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {[
              { t: "Automated revenue splits", d: "Define who earns what upfront. When a session generates revenue, every collaborator is paid their share automatically." },
              { t: "From 2 to 10 collaborators", d: "Solo-owned with guest collaborators, or fully co-owned — the contract engine handles any configuration." },
              { t: "Defined before going live", d: "No disputes after the fact. Terms are agreed upon and locked before the first session runs." },
              { t: "Every collab can become a community", d: "A successful collaboration can evolve into a co-owned continuing challenge community — with all terms carried forward." },
            ].map(({ t, d }) => (
              <div key={t} className="p-4 bg-white/3 rounded-xl border border-[#9CF0FF]/8">
                <p className="text-white font-bold text-sm font-headline mb-1">{t}</p>
                <p className="text-[#9CF0FF]/50 text-xs leading-relaxed">{d}</p>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Creator Space — Your Home Base",
      content: (
        <div className="space-y-4">
          <p>Every creator, studio, or gym on INFITRA has a permanent Creator Space — their broadcast home. It&apos;s where your community lives between sessions, where you publish updates, and where new audiences discover you.</p>
          <div className="space-y-3 mt-4">
            {[
              { t: "Publish updates, news & insights", d: "Share what you are building, what is coming, and what your community should know — on your schedule." },
              { t: "Announce sessions & challenges", d: "Followers get notified the moment you launch something new or go live." },
              { t: "Grows through every collaboration", d: "Every joint experience brings new communities into your space. Growth compounds with every shared experience." },
            ].map(({ t, d }) => (
              <div key={t} className="flex items-start gap-3 p-4 bg-white/3 rounded-xl border border-[#9CF0FF]/8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#FF6130] flex-shrink-0 mt-1.5" />
                <div>
                  <p className="text-white font-bold text-sm font-headline mb-0.5">{t}</p>
                  <p className="text-[#9CF0FF]/50 text-xs leading-relaxed">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "Challenge Communities — Where Engagement Happens",
      content: (
        <div className="space-y-4">
          <p>Challenge Communities are where real participation happens. Members post progress, hold each other accountable, and push forward together. Not a dead library — a living space owned by everyone in it.</p>
          <div className="space-y-3 mt-4">
            {[
              { t: "Continuing, not one-off", d: "Challenges link to the next. Momentum never dies. The community grows stronger with every cycle." },
              { t: "Solo-owned + Guest Collaborators", d: "Run it yourself and invite specialist creators to guest-host specific sessions — without giving up ownership." },
              { t: "Co-owned for long-term partnerships", d: "A gym and a creator, two recurring co-hosts — share full ownership with defined terms for both." },
              { t: "Multiple communities in parallel", d: "Different goals, different levels, different collaborators. Each with its own focus and structure." },
            ].map(({ t, d }) => (
              <div key={t} className="flex items-start gap-3 p-4 bg-white/3 rounded-xl border border-[#9CF0FF]/8">
                <span className="w-1.5 h-1.5 rounded-full bg-[#9CF0FF] flex-shrink-0 mt-1.5" />
                <div>
                  <p className="text-white font-bold text-sm font-headline mb-0.5">{t}</p>
                  <p className="text-[#9CF0FF]/50 text-xs leading-relaxed">{d}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      ),
    },
    {
      title: "How It Works — For Creators",
      content: (
        <div className="space-y-6 mt-2">
          {[
            { step: "01", title: "Create your space", desc: "Set up your permanent creator space — your broadcast home. Publish updates, build your audience, stay connected between sessions." },
            { step: "02", title: "Build your programme", desc: "Create live sessions and challenge communities. Choose: solo, co-owned, or open to Guest Collaborators. The contract engine handles terms and revenue upfront." },
            { step: "03", title: "Go live. Keep the cycle going.", desc: "Each challenge community deepens engagement. The next challenge brings back a stronger, more connected group. Nothing goes cold." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-5">
              <div className="flex-shrink-0 w-9 h-9 rounded-full border-2 border-[#FF6130]/40 flex items-center justify-center">
                <span className="text-xs font-black text-[#FF6130] font-headline">{step}</span>
              </div>
              <div>
                <h4 className="font-bold text-white mb-1 font-headline">{title}</h4>
                <p className="text-[#9CF0FF]/50 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "How It Works — For Participants",
      content: (
        <div className="space-y-6 mt-2">
          {[
            { step: "01", title: "Find your community", desc: "Discover communities aligned with your goals. Follow creators and join spaces built around real progress." },
            { step: "02", title: "Join — don't just access", desc: "Step into live sessions and challenge communities. Train, engage, and stay accountable with people moving toward the same goal." },
            { step: "03", title: "Grow together", desc: "Build momentum across challenges. Learn from multiple experts and experience training that evolves with you — and every collaboration." },
          ].map(({ step, title, desc }) => (
            <div key={step} className="flex gap-5">
              <div className="flex-shrink-0 w-9 h-9 rounded-full border-2 border-[#9CF0FF]/40 flex items-center justify-center">
                <span className="text-xs font-black text-[#9CF0FF] font-headline">{step}</span>
              </div>
              <div>
                <h4 className="font-bold text-white mb-1 font-headline">{title}</h4>
                <p className="text-[#9CF0FF]/50 text-sm leading-relaxed">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      ),
    },
    {
      title: "Gym × Creator — The Institutional Play",
      content: (
        <div className="space-y-4">
          <p>Your gym trainers are brilliant in person — but producing consistent digital content is a different skill. INFITRA lets gyms collaborate with specialist digital creators to serve their community at the highest level, without overloading their staff.</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-4">
            {[
              { side: "The Gym Wins", accent: "text-[#FF6130]", items: ["Unlock a new digital revenue stream — without changing your core business", "Expand beyond your physical capacity", "No extra hiring or production overhead", "Your brand, your community — fully owned"] },
              { side: "The Creator Wins", accent: "text-[#9CF0FF]", items: ["Access an established audience — without starting from zero", "Expand your reach through trusted gym brands", "Collaborate to deliver richer, multi-expert experiences", "Turn your expertise into scalable, recurring revenue"] },
            ].map(({ side, accent, items }) => (
              <div key={side} className="p-4 bg-white/3 rounded-xl border border-[#9CF0FF]/8">
                <p className={`text-xs font-black font-headline ${accent} mb-3`}>{side}</p>
                <ul className="space-y-2">
                  {items.map((item) => (
                    <li key={item} className="flex items-start gap-2 text-xs text-[#9CF0FF]/50 leading-relaxed">
                      <span className="w-1 h-1 rounded-full bg-[#9CF0FF]/40 flex-shrink-0 mt-1.5" />{item}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      ),
    },
  ];

  return (
    <div className="relative overflow-x-hidden bg-[#071318]">

      {/* ── NAV ── */}
      <nav className="fixed top-0 w-full z-50 bg-[#071318]/80 backdrop-blur-xl border-b border-[#9CF0FF]/10">
        <div className="max-w-7xl mx-auto px-6 py-3.5 flex items-center justify-between">
          <Link href="/">
            <div className="rounded-xl overflow-hidden hover:opacity-90 transition-opacity">
              <Image src="/logo-mark.png" alt="INFITRA" width={40} height={40} className="block" />
            </div>
          </Link>

          <div className="hidden md:flex items-center gap-10">
            {["About", "For Creators", "For Studios", "Early Access"].map((link) => (
              <a key={link} href="#"
                className="text-sm font-semibold text-[#9CF0FF]/50 hover:text-[#9CF0FF] transition-colors font-headline">
                {link}
              </a>
            ))}
          </div>

          <button className="px-6 py-2.5 bg-[#FF6130] text-white text-sm font-black rounded-full hover:scale-105 transition-all font-headline shadow-[0_0_20px_rgba(255,97,48,0.35)]">
            Request Creator Access
          </button>
        </div>
      </nav>

      <main>

        {/* ── HERO ── */}
        <section className="relative min-h-screen flex flex-col items-center justify-center px-6 pt-24 pb-20 overflow-hidden text-center">

          {/* Deep atmospheric background glow */}
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[1000px] h-[1000px] rounded-full bg-[#9CF0FF]/5 blur-[160px]" />
          </div>

          {/* Content — stacked: brand → neon mark → tagline → cta */}
          <div className="relative z-10 max-w-4xl mx-auto w-full flex flex-col items-center">

            {/* Badge */}
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-[#9CF0FF]/8 border border-[#9CF0FF]/20 mb-6">
              <span className="w-1.5 h-1.5 rounded-full bg-[#9CF0FF] animate-pulse" />
              <span className="text-[#9CF0FF] text-xs font-bold tracking-widest uppercase font-headline">Private Beta — Coming Soon</span>
            </div>

            <h1 className="text-7xl md:text-8xl lg:text-9xl font-black tracking-tighter leading-[0.85] text-[#FF6130] font-headline italic mb-6"
              style={{textShadow: "0 0 60px rgba(255,97,48,0.35)"}}>
              INFITRA
            </h1>

            {/* ── NEON MARK — 3D centrepiece ── */}
            <div className="relative w-64 h-64 md:w-[360px] md:h-[360px] mb-6 flex items-center justify-center">
              {/* Far atmospheric cyan halo — stays still */}
              <div className="absolute inset-0 scale-[1.8] rounded-full bg-[#9CF0FF]/4 blur-[90px]" />

              {/* Animated container — everything inside floats and twists */}
              <div className="float-twist absolute inset-0">

              {/* Shadow on the ground — moves with the float */}
              <div className="absolute w-[70%] h-[12%] bottom-[-12%] left-[15%] rounded-full bg-[#071318] blur-[20px] opacity-60" />

              {/* Deep shadow layer — offset down-right, dark teal */}
              <div className="absolute w-full h-full translate-x-[4px] translate-y-[5px]"
                style={{ filter: "brightness(0) opacity(0.3) blur(4px)" }}>
                <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
              </div>

              {/* Dark underside — darkened cyan, simulates the bottom face */}
              <div className="absolute w-full h-full translate-y-[2px]"
                style={{
                  filter: "brightness(0.4) saturate(1.4)",
                  maskImage: "linear-gradient(to top, black 30%, transparent 80%)",
                  WebkitMaskImage: "linear-gradient(to top, black 30%, transparent 80%)",
                }}>
                <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
              </div>

              {/* Base mark — the core #9CF0FF */}
              <div className="absolute w-full h-full">
                <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
              </div>

              {/* Mid-tone depth — slightly darker on the bottom-right for volume */}
              <div className="absolute w-full h-full"
                style={{
                  maskImage: "linear-gradient(315deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 35%, transparent 55%)",
                  WebkitMaskImage: "linear-gradient(315deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.15) 35%, transparent 55%)",
                  filter: "brightness(0.55) saturate(1.6)",
                }}>
                <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
              </div>

              {/* Highlight — brighter top-left for lit surface, stays in the cyan family */}
              <div className="absolute w-full h-full"
                style={{
                  maskImage: "linear-gradient(140deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 35%, transparent 55%)",
                  WebkitMaskImage: "linear-gradient(140deg, rgba(0,0,0,0.6) 0%, rgba(0,0,0,0.15) 35%, transparent 55%)",
                  filter: "brightness(1.35) saturate(0.8)",
                }}>
                <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
              </div>

              {/* Specular rim — tight white-ish edge on top-left for that 3D pop */}
              <div className="absolute w-full h-full"
                style={{
                  maskImage: "linear-gradient(150deg, rgba(0,0,0,0.35) 0%, transparent 20%)",
                  WebkitMaskImage: "linear-gradient(150deg, rgba(0,0,0,0.35) 0%, transparent 20%)",
                  filter: "brightness(2) saturate(0.4)",
                }}>
                <Image src="/logo-mark-cyan.png" alt="INFITRA" fill className="object-contain" />
              </div>

              </div>{/* close float-twist */}
            </div>

            {/* Tagline */}
            <p className="text-3xl md:text-4xl lg:text-5xl font-black text-white font-headline tracking-tight mb-4">
              Fitness beyond the Feed.
            </p>

            <p className="text-lg text-[#9CF0FF]/50 max-w-xl mx-auto leading-relaxed mb-10">
              A new fitness network where creators collaborate, audiences engage,
              and real communities drive results for everyone involved.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center">
              {/* Creator CTA — primary */}
              <div className="flex flex-col items-center">
                <button className="px-10 py-4 bg-[#FF6130] text-white rounded-full font-black text-lg hover:scale-105 transition-transform font-headline shadow-[0_0_30px_rgba(255,97,48,0.4)]">
                  Request Creator Access
                </button>
                <span className="text-[#9CF0FF]/30 text-xs mt-3 tracking-wide">
                  For creators, studios & gyms
                </span>
                <span className="text-[#9CF0FF]/20 text-[10px] tracking-wide">
                  Limited onboarding
                </span>
              </div>

              {/* Participant CTA — secondary */}
              <div className="flex flex-col items-center">
                <button className="px-10 py-4 bg-transparent border border-[#9CF0FF]/25 text-[#9CF0FF] rounded-full font-bold text-lg hover:bg-[#9CF0FF]/8 hover:border-[#9CF0FF]/40 transition-all font-headline">
                  Join the Waitlist
                </button>
                <span className="text-[#9CF0FF]/30 text-xs mt-3 tracking-wide">
                  Be first when INFITRA launches.
                </span>
              </div>
            </div>
          </div>
        </section>

        {/* ── THE TEASE ── */}
        <section className="py-32 px-6 bg-[#071318] relative overflow-hidden">
          <div className="absolute top-0 left-0 w-[400px] h-[400px] rounded-full bg-[#9CF0FF]/4 blur-[100px] pointer-events-none" />
          <div className="absolute bottom-0 right-0 w-[400px] h-[400px] rounded-full bg-[#FF6130]/4 blur-[100px] pointer-events-none" />

          <div className="max-w-5xl mx-auto relative z-10 grid grid-cols-1 md:grid-cols-2 gap-6">
            {[
              {
                number: "01",
                text: "Collaboration by design.",
                sub: "Contracts, splits, ownership — automated.",
                accent: "#FF6130",
              },
              {
                number: "02",
                text: "Engage and grow your audience.",
                sub: "Live experiences and communities built around shared purpose.",
                accent: "#9CF0FF",
              },
              {
                number: "03",
                text: "Go beyond your own expertise.",
                sub: "Collaborate to create richer, more immersive experiences.",
                accent: "#9CF0FF",
              },
              {
                number: "04",
                text: "From solo to multi-creator.",
                sub: "INFITRA handles the complexity — you grow through the network.",
                accent: "#FF6130",
              },
            ].map(({ number, text, sub, accent }) => (
              <div
                key={number}
                className="group relative"
              >
                {/* Geometric card platform */}
                <div
                  className="relative p-8 md:p-10 rounded-2xl bg-[#0F2229] border border-[#9CF0FF]/10 hover:border-[#9CF0FF]/25 transition-all duration-300 overflow-hidden h-full"
                  style={{
                    clipPath: "polygon(0 0, 100% 0, 100% calc(100% - 20px), calc(100% - 20px) 100%, 0 100%)",
                  }}
                >
                  {/* Corner accent triangle */}
                  <div
                    className="absolute top-0 right-0 w-16 h-16 opacity-20 group-hover:opacity-40 transition-opacity"
                    style={{
                      background: `linear-gradient(225deg, ${accent} 0%, transparent 60%)`,
                    }}
                  />

                  {/* Bottom-left glow on hover */}
                  <div
                    className="absolute bottom-0 left-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                    style={{
                      background: `radial-gradient(circle at bottom left, ${accent}15 0%, transparent 70%)`,
                    }}
                  />

                  {/* Number */}
                  <span
                    className="text-5xl md:text-6xl font-black font-headline tracking-tighter leading-none opacity-15 group-hover:opacity-25 transition-opacity absolute top-4 right-6"
                    style={{ color: accent }}
                  >
                    {number}
                  </span>

                  {/* Content */}
                  <div className="relative z-10">
                    <div
                      className="w-8 h-[2px] mb-6 transition-all duration-300 group-hover:w-12"
                      style={{ background: accent }}
                    />
                    <h3 className="text-2xl md:text-3xl font-black text-white font-headline tracking-tight leading-tight mb-3 group-hover:text-[#9CF0FF] transition-colors">
                      {text}
                    </h3>
                    <p className="text-base md:text-lg text-[#9CF0FF]/40 font-headline leading-relaxed">
                      {sub}
                    </p>
                  </div>

                  {/* Clipped corner visual — angled bottom-right */}
                  <div
                    className="absolute bottom-0 right-0 w-[20px] h-[20px]"
                    style={{
                      background: `linear-gradient(225deg, transparent 50%, ${accent}30 50%)`,
                    }}
                  />
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── TWO SIDES ── */}
        <section className="py-28 px-6 bg-[#0A1A1F] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[400px] rounded-full bg-[#9CF0FF]/5 blur-[100px] pointer-events-none" />
          <div className="max-w-5xl mx-auto relative z-10">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-px bg-[#9CF0FF]/10 rounded-3xl overflow-hidden">

              {/* Creators */}
              <div className="bg-[#0A1A1F] p-12 md:p-16 group hover:bg-[#0F2229] transition-colors">
                <span className="text-xs font-bold tracking-widest uppercase text-[#FF6130] font-headline block mb-6">
                  Creators, Studios & Gyms
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-white font-headline tracking-tight leading-tight mb-6">
                  Build. Collaborate.
                  <br />
                  <span className="text-[#FF6130]">Own it.</span>
                </h2>
                <p className="text-[#9CF0FF]/50 leading-relaxed text-lg mb-8">
                  Your community. Your network. Your terms.
                  INFITRA gives you the infrastructure to collaborate
                  with other creators and grow beyond your audience.
                </p>
                <div>
                  <button className="px-8 py-3.5 bg-[#FF6130] text-white rounded-full font-black text-sm hover:scale-105 transition-transform font-headline shadow-[0_0_20px_rgba(255,97,48,0.3)]">
                    Request Creator Access
                  </button>
                  <p className="text-[#9CF0FF]/25 text-xs mt-3 tracking-wide">
                    For creators, studios & gyms
                  </p>
                  <p className="text-[#9CF0FF]/20 text-[10px] tracking-wide">
                    Limited onboarding
                  </p>
                </div>
              </div>

              {/* Participants */}
              <div className="bg-[#0A1A1F] p-12 md:p-16 group hover:bg-[#0F2229] transition-colors">
                <span className="text-xs font-bold tracking-widest uppercase text-[#9CF0FF] font-headline block mb-6">
                  Participants
                </span>
                <h2 className="text-4xl md:text-5xl font-black text-white font-headline tracking-tight leading-tight mb-6">
                  Join. Participate.
                  <br />
                  <span className="text-[#9CF0FF]" style={{textShadow:"0 0 20px rgba(156,240,255,0.3)"}}>Stay.</span>
                </h2>
                <p className="text-[#9CF0FF]/50 leading-relaxed text-lg mb-8">
                  Join real fitness communities — participate, engage with purpose
                  and experience training shaped by multiple experts. Access dynamic
                  offerings, not static content.
                </p>
                <div>
                  <button className="px-8 py-3.5 bg-transparent border border-[#9CF0FF]/25 text-[#9CF0FF] rounded-full font-bold text-sm hover:bg-[#9CF0FF]/8 hover:border-[#9CF0FF]/40 transition-all font-headline">
                    Join the Waitlist
                  </button>
                  <p className="text-[#9CF0FF]/25 text-xs mt-3 tracking-wide">
                    Be first when INFITRA launches.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── EARLY ACCESS CTA ── */}
        <section className="py-32 px-6 bg-[#071318] relative overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[800px] h-[500px] rounded-full bg-[#9CF0FF]/6 blur-[120px]" />
          </div>
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none opacity-[0.04]">
            <div className="relative w-[600px] h-[600px]">
              <Image src="/logo-mark-cyan.png" alt="" fill className="object-contain" aria-hidden />
            </div>
          </div>

          <div className="max-w-2xl mx-auto text-center relative z-10">
            <h2 className="text-5xl md:text-6xl font-black text-white font-headline tracking-tight mb-4">
              Be part of the first INFITRA network.
            </h2>
            <p className="text-xl text-[#9CF0FF]/50 mb-4 leading-relaxed">
              Private Beta coming soon.
            </p>
            <p className="text-base text-[#9CF0FF]/35 mb-12 leading-relaxed">
              Creators are onboarded selectively — participants can join the waitlist.
            </p>

            <div className="flex flex-col sm:flex-row gap-6 justify-center mb-4">
              {/* Creator CTA — primary */}
              <div className="flex flex-col items-center">
                <button className="px-10 py-4 bg-[#FF6130] text-white rounded-full font-black text-lg hover:scale-105 transition-transform font-headline shadow-[0_0_30px_rgba(255,97,48,0.4)]">
                  Request Creator Access
                </button>
                <span className="text-[#9CF0FF]/30 text-xs mt-3 tracking-wide">
                  For creators, studios & gyms
                </span>
                <span className="text-[#9CF0FF]/20 text-[10px] tracking-wide">
                  Limited onboarding
                </span>
              </div>

              {/* Participant CTA — secondary */}
              <div className="flex flex-col items-center">
                <button className="px-10 py-4 bg-transparent border border-[#9CF0FF]/25 text-[#9CF0FF] rounded-full font-bold text-lg hover:bg-[#9CF0FF]/8 hover:border-[#9CF0FF]/40 transition-all font-headline">
                  Join the Waitlist
                </button>
                <span className="text-[#9CF0FF]/30 text-xs mt-3 tracking-wide">
                  Be first when INFITRA launches.
                </span>
              </div>
            </div>

            <p className="text-[#9CF0FF]/20 text-xs mt-6 tracking-wide">
              No spam. Early access notification only.
            </p>
          </div>
        </section>

        {/* ── INSIDE INFITRA — deep dive (collapsed by default) ── */}
        <section className="py-24 px-6 bg-[#0A1A1F] relative overflow-hidden">
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#9CF0FF]/3 blur-[150px] pointer-events-none" />

          <div className="max-w-3xl mx-auto relative z-10">
            <MasterAccordion
              title="Inside INFITRA"
              subtitle="Explore how the network works and grows."
            >
              <Accordion items={accordionItems} />
            </MasterAccordion>
          </div>
        </section>

      </main>

      {/* ── FOOTER ── */}
      <footer className="bg-[#040D10] border-t border-[#9CF0FF]/10">
        <div className="max-w-7xl mx-auto px-8 py-12 flex flex-col md:flex-row items-start md:items-center justify-between gap-8">
          <div className="flex items-center gap-3">
            <div className="rounded-xl overflow-hidden">
              <Image src="/logo-mark.png" alt="INFITRA" width={32} height={32} className="block" />
            </div>
            <span className="text-lg font-black text-[#FF6130] tracking-tighter font-headline italic">INFITRA</span>
          </div>
          <p className="text-sm text-[#9CF0FF]/30 max-w-xs leading-relaxed">
            Where creators, studios, and gyms build real fitness communities
            through live experiences and collaboration.
          </p>
          <div className="flex gap-8">
            {["Privacy", "Terms", "Contact"].map((link) => (
              <a key={link} href="#" className="text-[#9CF0FF]/30 hover:text-[#9CF0FF] transition-colors text-sm">
                {link}
              </a>
            ))}
          </div>
        </div>
        <div className="max-w-7xl mx-auto px-8 py-5 border-t border-[#9CF0FF]/8">
          <span className="text-[#9CF0FF]/20 text-xs uppercase tracking-widest font-bold">
            © 2025 INFITRA — Fitness beyond the Feed.
          </span>
        </div>
      </footer>

    </div>
  );
}
