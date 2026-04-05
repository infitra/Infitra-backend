"use client";

import { useState, useActionState } from "react";
import { completeOnboarding } from "@/app/actions/profile";
import Image from "next/image";
import Link from "next/link";

export function OnboardingForm() {
  const [step, setStep] = useState<1 | 2>(1);
  const [role, setRole] = useState<"creator" | "participant" | null>(null);
  const [state, action, pending] = useActionState(completeOnboarding, null);

  return (
    <div className="min-h-screen flex flex-col items-center justify-center px-6 relative">
      {/* Atmospheric glow */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] rounded-full bg-[#9CF0FF]/4 blur-[150px]" />
      </div>

      {/* Logo */}
      <Link href="/" className="relative z-10 mb-10">
        <div className="flex items-center gap-3">
          <div className="rounded-xl overflow-hidden">
            <Image
              src="/logo-mark.png"
              alt="INFITRA"
              width={40}
              height={40}
              className="block"
            />
          </div>
          <span className="text-2xl font-black text-[#FF6130] tracking-tighter font-headline italic">
            INFITRA
          </span>
        </div>
      </Link>

      <div className="relative z-10 w-full max-w-lg">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              step === 1 ? "bg-[#9CF0FF]" : "bg-[#9CF0FF]/20"
            }`}
          />
          <div
            className={`w-2 h-2 rounded-full transition-colors ${
              step === 2 ? "bg-[#9CF0FF]" : "bg-[#9CF0FF]/20"
            }`}
          />
        </div>

        {step === 1 && (
          <div>
            <h1 className="text-3xl md:text-4xl font-black text-white font-headline tracking-tight text-center mb-3">
              How will you use INFITRA?
            </h1>
            <p className="text-sm text-[#9CF0FF]/40 text-center mb-10">
              This choice is permanent and shapes your entire experience.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Creator card */}
              <button
                type="button"
                onClick={() => {
                  setRole("creator");
                  setStep(2);
                }}
                className={`group relative p-8 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.02] ${
                  role === "creator"
                    ? "border-[#FF6130]/50 bg-[#FF6130]/8"
                    : "border-[#9CF0FF]/10 bg-[#0F2229] hover:border-[#FF6130]/30"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#FF6130]/15 border border-[#FF6130]/30 flex items-center justify-center mb-5">
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#FF6130"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M12 2L2 7l10 5 10-5-10-5z" />
                    <path d="M2 17l10 5 10-5" />
                    <path d="M2 12l10 5 10-5" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-white font-headline tracking-tight mb-2 group-hover:text-[#FF6130] transition-colors">
                  I&apos;m a Creator
                </h3>
                <p className="text-xs text-[#9CF0FF]/40 leading-relaxed">
                  Build sessions, collaborate with other creators, and grow your
                  audience through live experiences.
                </p>
                <span className="block text-[10px] text-[#FF6130]/50 mt-4 uppercase tracking-widest font-bold font-headline">
                  Creators, Studios & Gyms
                </span>
              </button>

              {/* Participant card */}
              <button
                type="button"
                onClick={() => {
                  setRole("participant");
                  setStep(2);
                }}
                className={`group relative p-8 rounded-2xl border text-left transition-all duration-300 hover:scale-[1.02] ${
                  role === "participant"
                    ? "border-[#9CF0FF]/50 bg-[#9CF0FF]/8"
                    : "border-[#9CF0FF]/10 bg-[#0F2229] hover:border-[#9CF0FF]/30"
                }`}
              >
                <div className="w-10 h-10 rounded-full bg-[#9CF0FF]/15 border border-[#9CF0FF]/30 flex items-center justify-center mb-5">
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#9CF0FF"
                    strokeWidth={1.5}
                    viewBox="0 0 24 24"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" />
                    <circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" />
                    <path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                </div>
                <h3 className="text-xl font-black text-white font-headline tracking-tight mb-2 group-hover:text-[#9CF0FF] transition-colors">
                  I&apos;m a Participant
                </h3>
                <p className="text-xs text-[#9CF0FF]/40 leading-relaxed">
                  Join live fitness communities, train with real experts, and
                  grow with others who share your goals.
                </p>
                <span className="block text-[10px] text-[#9CF0FF]/50 mt-4 uppercase tracking-widest font-bold font-headline">
                  Join communities
                </span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && role && (
          <div className="bg-[#0F2229] rounded-2xl border border-[#9CF0FF]/10 p-8 md:p-10">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-[#9CF0FF]/40 hover:text-[#9CF0FF] transition-colors mb-6 flex items-center gap-1.5 font-headline"
            >
              <svg
                width="14"
                height="14"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M19 12H5M12 19l-7-7 7-7"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              Back
            </button>

            <h1 className="text-2xl font-black text-white font-headline tracking-tight mb-2">
              Set up your profile.
            </h1>
            <p className="text-sm text-[#9CF0FF]/40 mb-8">
              {role === "creator"
                ? "This is how collaborators and participants will see you."
                : "This is how creators and other participants will see you."}
            </p>

            {state?.error && (
              <div className="mb-6 p-3 rounded-xl bg-[#FF6130]/10 border border-[#FF6130]/20">
                <p className="text-sm text-[#FF6130]">{state.error}</p>
              </div>
            )}

            <form action={action} className="space-y-4">
              <input type="hidden" name="role" value={role} />

              <div>
                <label
                  htmlFor="display_name"
                  className="block text-xs font-bold text-[#9CF0FF]/50 uppercase tracking-wider mb-2 font-headline"
                >
                  Display Name
                </label>
                <input
                  id="display_name"
                  name="display_name"
                  type="text"
                  required
                  minLength={2}
                  maxLength={50}
                  placeholder={
                    role === "creator"
                      ? "Your name or studio name"
                      : "Your name"
                  }
                  className="w-full px-4 py-3 rounded-xl bg-[#071318] border border-[#9CF0FF]/15 text-white placeholder-[#9CF0FF]/25 focus:outline-none focus:border-[#9CF0FF]/40 transition-colors text-sm"
                />
              </div>

              <button
                type="submit"
                disabled={pending}
                className={`w-full mt-4 py-3.5 rounded-full font-black text-sm hover:scale-[1.02] transition-transform font-headline disabled:opacity-50 disabled:hover:scale-100 ${
                  role === "creator"
                    ? "bg-[#FF6130] text-white shadow-[0_0_20px_rgba(255,97,48,0.3)]"
                    : "bg-[#9CF0FF] text-[#071318] shadow-[0_0_20px_rgba(156,240,255,0.3)]"
                }`}
              >
                {pending ? "..." : "Get Started"}
              </button>
            </form>

            {/* Role indicator */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <div
                className={`w-1.5 h-1.5 rounded-full ${
                  role === "creator" ? "bg-[#FF6130]" : "bg-[#9CF0FF]"
                }`}
              />
              <span className="text-[10px] uppercase tracking-widest font-bold text-[#9CF0FF]/30 font-headline">
                {role === "creator"
                  ? "Creator Account"
                  : "Participant Account"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
