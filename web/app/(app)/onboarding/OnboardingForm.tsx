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
      {/* Logo */}
      <Link href="/" className="relative z-10 mb-10 mt-10">
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
          <span className="text-2xl font-black text-[#FF6130] tracking-tighter font-headline">
            INFITRA
          </span>
        </div>
      </Link>

      <div className="relative z-10 w-full max-w-lg pb-12">
        {/* Progress dots */}
        <div className="flex justify-center gap-2 mb-8">
          <div
            className="w-2 h-2 rounded-full transition-colors"
            style={{
              backgroundColor:
                step === 1 ? "#0891b2" : "rgba(15, 34, 41, 0.20)",
            }}
          />
          <div
            className="w-2 h-2 rounded-full transition-colors"
            style={{
              backgroundColor:
                step === 2 ? "#0891b2" : "rgba(15, 34, 41, 0.20)",
            }}
          />
        </div>

        {step === 1 && (
          <div>
            <h1
              className="text-3xl md:text-4xl font-black font-headline tracking-tight text-center mb-3"
              style={{ color: "#0F2229" }}
            >
              How will you use INFITRA?
            </h1>
            <p
              className="text-sm text-center mb-10"
              style={{ color: "#64748b" }}
            >
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
                className="group relative p-8 rounded-2xl text-left transition-all duration-300 hover:scale-[1.02] infitra-glass-interactive"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-5"
                  style={{
                    backgroundColor: "rgba(255, 97, 48, 0.12)",
                    border: "1px solid rgba(255, 97, 48, 0.30)",
                  }}
                >
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
                <h3
                  className="text-xl font-black font-headline tracking-tight mb-2"
                  style={{ color: "#0F2229" }}
                >
                  I&apos;m a Creator
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                  Build sessions, collaborate with other creators, and grow your
                  audience through live experiences.
                </p>
                <span
                  className="block text-[10px] mt-4 uppercase tracking-widest font-bold font-headline"
                  style={{ color: "#FF6130" }}
                >
                  Creators, Studios &amp; Gyms
                </span>
              </button>

              {/* Participant card */}
              <button
                type="button"
                onClick={() => {
                  setRole("participant");
                  setStep(2);
                }}
                className="group relative p-8 rounded-2xl text-left transition-all duration-300 hover:scale-[1.02] infitra-glass-interactive"
              >
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center mb-5"
                  style={{
                    backgroundColor: "rgba(8, 145, 178, 0.12)",
                    border: "1px solid rgba(8, 145, 178, 0.30)",
                  }}
                >
                  <svg
                    width="20"
                    height="20"
                    fill="none"
                    stroke="#0891b2"
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
                <h3
                  className="text-xl font-black font-headline tracking-tight mb-2"
                  style={{ color: "#0F2229" }}
                >
                  I&apos;m a Participant
                </h3>
                <p className="text-xs leading-relaxed" style={{ color: "#64748b" }}>
                  Join live fitness communities, train with real experts, and
                  grow with others who share your goals.
                </p>
                <span
                  className="block text-[10px] mt-4 uppercase tracking-widest font-bold font-headline"
                  style={{ color: "#0891b2" }}
                >
                  Join communities
                </span>
              </button>
            </div>
          </div>
        )}

        {step === 2 && role && (
          <div className="rounded-2xl p-8 md:p-10 infitra-glass">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs transition-colors mb-6 flex items-center gap-1.5 font-headline"
              style={{ color: "#64748b" }}
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

            <h1
              className="text-2xl font-black font-headline tracking-tight mb-2"
              style={{ color: "#0F2229" }}
            >
              Set up your profile.
            </h1>
            <p className="text-sm mb-8" style={{ color: "#64748b" }}>
              {role === "creator"
                ? "This is how collaborators and participants will see you."
                : "This is how creators and other participants will see you."}
            </p>

            {state?.error && (
              <div
                className="mb-6 p-3 rounded-xl"
                style={{
                  backgroundColor: "rgba(255, 97, 48, 0.10)",
                  border: "1px solid rgba(255, 97, 48, 0.30)",
                }}
              >
                <p className="text-sm" style={{ color: "#FF6130" }}>
                  {state.error}
                </p>
              </div>
            )}

            <form action={action} className="space-y-4">
              <input type="hidden" name="role" value={role} />

              <div>
                <label
                  htmlFor="display_name"
                  className="block text-xs font-bold uppercase tracking-wider mb-2 font-headline"
                  style={{ color: "rgba(15, 34, 41, 0.55)" }}
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
                  className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors text-sm"
                  style={{
                    backgroundColor: "rgba(255, 255, 255, 0.78)",
                    border: "1px solid rgba(15, 34, 41, 0.15)",
                    color: "#0F2229",
                  }}
                />
                <p className="text-[11px] mt-1.5" style={{ color: "#94a3b8" }}>
                  {role === "creator"
                    ? "How you'll appear on INFITRA."
                    : "How you'll appear to creators and other participants."}
                </p>
              </div>

              {/* Legal name + attestation — creators only. Captures the signing
                  identity once, up front. Every contract from this creator
                  onward renders automatically with no further prompts. */}
              {role === "creator" && (
                <>
                  <div>
                    <label
                      htmlFor="legal_name"
                      className="block text-xs font-bold uppercase tracking-wider mb-2 font-headline"
                      style={{ color: "rgba(15, 34, 41, 0.55)" }}
                    >
                      Legal Name
                    </label>
                    <input
                      id="legal_name"
                      name="legal_name"
                      type="text"
                      required
                      minLength={2}
                      maxLength={100}
                      placeholder="Your full legal name"
                      className="w-full px-4 py-3 rounded-xl focus:outline-none transition-colors text-sm"
                      style={{
                        backgroundColor: "rgba(255, 255, 255, 0.78)",
                        border: "1px solid rgba(15, 34, 41, 0.15)",
                        color: "#0F2229",
                      }}
                    />
                    <p className="text-[11px] mt-1.5" style={{ color: "#94a3b8" }}>
                      Appears on collaboration contracts.
                    </p>
                  </div>

                  <label className="flex items-start gap-3 cursor-pointer select-none pt-1">
                    <input
                      type="checkbox"
                      name="attested"
                      required
                      className="mt-0.5 w-4 h-4 shrink-0 cursor-pointer accent-[#FF6130]"
                    />
                    <span className="text-xs text-[#0F2229] leading-relaxed">
                      I confirm this is my legal name and I can sign collaboration contracts under it.
                    </span>
                  </label>
                </>
              )}

              <button
                type="submit"
                disabled={pending}
                className="w-full mt-4 py-3.5 rounded-full font-black text-sm hover:scale-[1.02] transition-transform font-headline disabled:opacity-50 disabled:hover:scale-100 text-white"
                style={{
                  backgroundColor:
                    role === "creator" ? "#FF6130" : "#0891b2",
                  boxShadow:
                    role === "creator"
                      ? "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)"
                      : "0 4px 14px rgba(8,145,178,0.35), 0 2px 6px rgba(8,145,178,0.20)",
                }}
              >
                {pending ? "..." : "Get Started"}
              </button>
            </form>

            {/* Role indicator */}
            <div className="mt-6 flex items-center justify-center gap-2">
              <div
                className="w-1.5 h-1.5 rounded-full"
                style={{
                  backgroundColor: role === "creator" ? "#FF6130" : "#0891b2",
                }}
              />
              <span
                className="text-[10px] uppercase tracking-widest font-bold font-headline"
                style={{ color: "#94a3b8" }}
              >
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
