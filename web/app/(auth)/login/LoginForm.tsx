"use client";

import { useState, useActionState } from "react";
import { signIn, signUp } from "@/app/actions/auth";

type Mode = "signin" | "signup";
type SignupStep = 1 | 2;

export function LoginForm() {
  const [mode, setMode] = useState<Mode>("signin");
  const [signupStep, setSignupStep] = useState<SignupStep>(1);
  const [selectedRole, setSelectedRole] = useState<"creator" | "participant" | null>(null);
  const [displayName, setDisplayName] = useState("");

  const [signInState, signInAction, signInPending] = useActionState(signIn, null);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, null);

  function resetSignup() {
    setSignupStep(1);
    setSelectedRole(null);
    setDisplayName("");
  }

  function switchMode(m: Mode) {
    setMode(m);
    resetSignup();
  }

  return (
    <div className="bg-[#0F2229] rounded-2xl border border-[#9CF0FF]/10 p-8 md:p-10">

      {/* Tab switcher */}
      <div className="flex mb-8 bg-[#071318] rounded-full p-1">
        <button type="button" onClick={() => switchMode("signin")}
          className={`flex-1 py-2.5 text-sm font-bold font-headline rounded-full transition-all ${
            mode === "signin" ? "bg-[#9CF0FF]/15 text-[#9CF0FF]" : "text-[#9CF0FF]/40 hover:text-[#9CF0FF]/60"
          }`}>
          Sign In
        </button>
        <button type="button" onClick={() => switchMode("signup")}
          className={`flex-1 py-2.5 text-sm font-bold font-headline rounded-full transition-all ${
            mode === "signup" ? "bg-[#9CF0FF]/15 text-[#9CF0FF]" : "text-[#9CF0FF]/40 hover:text-[#9CF0FF]/60"
          }`}>
          Sign Up
        </button>
      </div>

      {/* ── SIGN IN ── */}
      {mode === "signin" && (
        <>
          <h1 className="text-2xl font-black text-white font-headline tracking-tight mb-2">
            Welcome back.
          </h1>
          <p className="text-sm text-[#9CF0FF]/40 mb-8">Sign in to your account.</p>

          {signInState?.error && (
            <div className="mb-6 p-3 rounded-xl bg-[#FF6130]/10 border border-[#FF6130]/20">
              <p className="text-sm text-[#FF6130]">{signInState.error}</p>
            </div>
          )}

          <form action={signInAction} className="space-y-4">
            <div>
              <label htmlFor="email" className="block text-xs font-bold text-[#9CF0FF]/50 uppercase tracking-wider mb-2 font-headline">
                Email
              </label>
              <input id="email" name="email" type="email" required autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-[#071318] border border-[#9CF0FF]/15 text-white placeholder-[#9CF0FF]/25 focus:outline-none focus:border-[#9CF0FF]/40 transition-colors text-sm" />
            </div>
            <div>
              <label htmlFor="password" className="block text-xs font-bold text-[#9CF0FF]/50 uppercase tracking-wider mb-2 font-headline">
                Password
              </label>
              <input id="password" name="password" type="password" required autoComplete="current-password"
                placeholder="Your password"
                className="w-full px-4 py-3 rounded-xl bg-[#071318] border border-[#9CF0FF]/15 text-white placeholder-[#9CF0FF]/25 focus:outline-none focus:border-[#9CF0FF]/40 transition-colors text-sm" />
            </div>
            <button type="submit" disabled={signInPending}
              className="w-full mt-2 py-3.5 bg-[#FF6130] text-white rounded-full font-black text-sm hover:scale-[1.02] transition-transform font-headline shadow-[0_0_20px_rgba(255,97,48,0.3)] disabled:opacity-50 disabled:hover:scale-100">
              {signInPending ? "..." : "Sign In"}
            </button>
          </form>
        </>
      )}

      {/* ── SIGN UP — Step 1: Role + Name ── */}
      {mode === "signup" && signupStep === 1 && (
        <>
          <h1 className="text-2xl font-black text-white font-headline tracking-tight mb-2">
            Join INFITRA.
          </h1>
          <p className="text-sm text-[#9CF0FF]/40 mb-8">
            Choose your role — this is permanent.
          </p>

          {/* Role cards */}
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              {
                value: "creator" as const,
                label: "Creator",
                desc: "Build & collaborate",
                accent: "#FF6130",
                icon: (
                  <svg width="18" height="18" fill="none" stroke="#FF6130" strokeWidth={1.5} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M12 2L2 7l10 5 10-5-10-5z" /><path d="M2 17l10 5 10-5" /><path d="M2 12l10 5 10-5" />
                  </svg>
                ),
              },
              {
                value: "participant" as const,
                label: "Participant",
                desc: "Join & engage",
                accent: "#9CF0FF",
                icon: (
                  <svg width="18" height="18" fill="none" stroke="#9CF0FF" strokeWidth={1.5} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
              },
            ].map(({ value, label, desc, accent, icon }) => (
              <button key={value} type="button" onClick={() => setSelectedRole(value)}
                className={`p-4 rounded-xl border text-left transition-all duration-200 hover:scale-[1.02] ${
                  selectedRole === value
                    ? `border-[${accent}]/50 bg-[${accent}]/8`
                    : "border-[#9CF0FF]/10 bg-[#071318] hover:border-[#9CF0FF]/20"
                }`}
                style={{
                  borderColor: selectedRole === value ? `${accent}80` : undefined,
                  background: selectedRole === value ? `${accent}12` : undefined,
                }}>
                <div className="mb-2">{icon}</div>
                <p className="text-sm font-black text-white font-headline">{label}</p>
                <p className="text-xs text-[#9CF0FF]/40 mt-0.5">{desc}</p>
              </button>
            ))}
          </div>

          {/* Display name */}
          <div className="mb-6">
            <label htmlFor="signup_display_name" className="block text-xs font-bold text-[#9CF0FF]/50 uppercase tracking-wider mb-2 font-headline">
              Display Name
            </label>
            <input id="signup_display_name" type="text" value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              minLength={2} maxLength={50}
              placeholder="Your name or studio name"
              className="w-full px-4 py-3 rounded-xl bg-[#071318] border border-[#9CF0FF]/15 text-white placeholder-[#9CF0FF]/25 focus:outline-none focus:border-[#9CF0FF]/40 transition-colors text-sm" />
          </div>

          <button type="button"
            disabled={!selectedRole || displayName.trim().length < 2}
            onClick={() => setSignupStep(2)}
            className="w-full py-3.5 bg-[#FF6130] text-white rounded-full font-black text-sm hover:scale-[1.02] transition-transform font-headline shadow-[0_0_20px_rgba(255,97,48,0.3)] disabled:opacity-30 disabled:hover:scale-100">
            Continue
          </button>
        </>
      )}

      {/* ── SIGN UP — Step 2: Email + Password ── */}
      {mode === "signup" && signupStep === 2 && (
        <>
          <button type="button" onClick={() => setSignupStep(1)}
            className="text-xs text-[#9CF0FF]/40 hover:text-[#9CF0FF] transition-colors mb-6 flex items-center gap-1.5 font-headline">
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>

          <h1 className="text-2xl font-black text-white font-headline tracking-tight mb-1">
            Create your account.
          </h1>
          <div className="flex items-center gap-2 mb-8">
            <div className={`w-1.5 h-1.5 rounded-full ${selectedRole === "creator" ? "bg-[#FF6130]" : "bg-[#9CF0FF]"}`} />
            <span className="text-xs text-[#9CF0FF]/40 font-headline uppercase tracking-widest font-bold">
              {selectedRole === "creator" ? "Creator" : "Participant"} · {displayName}
            </span>
          </div>

          {signUpState?.error && (
            <div className="mb-6 p-3 rounded-xl bg-[#FF6130]/10 border border-[#FF6130]/20">
              <p className="text-sm text-[#FF6130]">{signUpState.error}</p>
            </div>
          )}

          <form action={signUpAction} className="space-y-4">
            {/* Hidden fields — role and display_name set in step 1 */}
            <input type="hidden" name="role" value={selectedRole ?? ""} />
            <input type="hidden" name="display_name" value={displayName} />

            <div>
              <label htmlFor="signup_email" className="block text-xs font-bold text-[#9CF0FF]/50 uppercase tracking-wider mb-2 font-headline">
                Email
              </label>
              <input id="signup_email" name="email" type="email" required autoComplete="email"
                placeholder="you@example.com"
                className="w-full px-4 py-3 rounded-xl bg-[#071318] border border-[#9CF0FF]/15 text-white placeholder-[#9CF0FF]/25 focus:outline-none focus:border-[#9CF0FF]/40 transition-colors text-sm" />
            </div>
            <div>
              <label htmlFor="signup_password" className="block text-xs font-bold text-[#9CF0FF]/50 uppercase tracking-wider mb-2 font-headline">
                Password
              </label>
              <input id="signup_password" name="password" type="password" required autoComplete="new-password"
                placeholder="Min. 8 characters" minLength={8}
                className="w-full px-4 py-3 rounded-xl bg-[#071318] border border-[#9CF0FF]/15 text-white placeholder-[#9CF0FF]/25 focus:outline-none focus:border-[#9CF0FF]/40 transition-colors text-sm" />
            </div>

            <button type="submit" disabled={signUpPending}
              className="w-full mt-2 py-3.5 bg-[#FF6130] text-white rounded-full font-black text-sm hover:scale-[1.02] transition-transform font-headline shadow-[0_0_20px_rgba(255,97,48,0.3)] disabled:opacity-50 disabled:hover:scale-100">
              {signUpPending ? "..." : "Create Account"}
            </button>
          </form>
        </>
      )}

      {/* Switch mode link */}
      <p className="text-center text-xs text-[#9CF0FF]/25 mt-6">
        {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
        <button type="button" onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
          className="text-[#9CF0FF]/50 hover:text-[#9CF0FF] transition-colors">
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
