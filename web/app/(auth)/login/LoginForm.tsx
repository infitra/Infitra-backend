"use client";

import { useState, useActionState } from "react";
import { signIn, signUp } from "@/app/actions/auth";

type Mode = "signin" | "signup";
type SignupStep = 1 | 2;

/**
 * Sign-in / sign-up surface. Cream + wave theme — matches the landing
 * page and the rest of the production app. Card sits on cream with a
 * soft white fill + hairline border so the wave glows through the
 * margins. Inputs are white-on-slate, accents stay brand orange / cyan.
 */
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

  // Shared input styles for the cream theme — keep one source of truth.
  const inputClass =
    "w-full px-4 py-3 rounded-xl text-sm focus:outline-none transition-colors";
  const inputStyle: React.CSSProperties = {
    backgroundColor: "rgba(255,255,255,0.78)",
    border: "1px solid rgba(15,34,41,0.15)",
    color: "#0F2229",
  };
  const labelClass =
    "block text-[10px] font-bold uppercase tracking-wider mb-2 font-headline";
  const labelStyle: React.CSSProperties = { color: "rgba(15,34,41,0.55)" };

  return (
    <div
      className="rounded-3xl p-8 md:p-10"
      style={{
        backgroundColor: "rgba(255,255,255,0.85)",
        border: "1px solid rgba(15,34,41,0.08)",
        boxShadow: "0 16px 48px rgba(15,34,41,0.06)",
      }}
    >
      {/* Tab switcher */}
      <div
        className="flex mb-8 rounded-full p-1"
        style={{ backgroundColor: "rgba(15,34,41,0.04)" }}
      >
        <button
          type="button"
          onClick={() => switchMode("signin")}
          className="flex-1 py-2.5 text-sm rounded-full transition-all font-headline"
          style={
            mode === "signin"
              ? {
                  backgroundColor: "#FFFFFF",
                  color: "#0F2229",
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(15,34,41,0.06)",
                }
              : { color: "rgba(15,34,41,0.45)", fontWeight: 700 }
          }
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => switchMode("signup")}
          className="flex-1 py-2.5 text-sm rounded-full transition-all font-headline"
          style={
            mode === "signup"
              ? {
                  backgroundColor: "#FFFFFF",
                  color: "#0F2229",
                  fontWeight: 700,
                  boxShadow: "0 2px 8px rgba(15,34,41,0.06)",
                }
              : { color: "rgba(15,34,41,0.45)", fontWeight: 700 }
          }
        >
          Sign Up
        </button>
      </div>

      {/* ── SIGN IN ── */}
      {mode === "signin" && (
        <>
          <h1
            className="text-2xl font-headline tracking-tight mb-2"
            style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Welcome back.
          </h1>
          <p className="text-sm mb-8" style={{ color: "#64748b" }}>
            Sign in to your account.
          </p>

          {signInState?.error && (
            <div
              className="mb-6 p-3 rounded-xl"
              style={{
                backgroundColor: "rgba(255,97,48,0.10)",
                border: "1px solid rgba(255,97,48,0.30)",
              }}
            >
              <p className="text-sm" style={{ color: "#FF6130" }}>
                {signInState.error}
              </p>
            </div>
          )}

          <form action={signInAction} className="space-y-4">
            <div>
              <label htmlFor="email" className={labelClass} style={labelStyle}>
                Email
              </label>
              <input
                id="email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="password" className={labelClass} style={labelStyle}>
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                autoComplete="current-password"
                placeholder="Your password"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <button
              type="submit"
              disabled={signInPending}
              className="w-full mt-2 py-3.5 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              style={{
                backgroundColor: "#FF6130",
                fontWeight: 700,
                boxShadow:
                  "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
              }}
            >
              {signInPending ? "..." : "Sign In"}
            </button>
          </form>
        </>
      )}

      {/* ── SIGN UP — Step 1: Role + Name ── */}
      {mode === "signup" && signupStep === 1 && (
        <>
          <h1
            className="text-2xl font-headline tracking-tight mb-2"
            style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Join INFITRA.
          </h1>
          <p className="text-sm mb-8" style={{ color: "#64748b" }}>
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
                accent: "#0891b2",
                icon: (
                  <svg width="18" height="18" fill="none" stroke="#0891b2" strokeWidth={1.5} viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /><circle cx="9" cy="7" r="4" />
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87" /><path d="M16 3.13a4 4 0 0 1 0 7.75" />
                  </svg>
                ),
              },
            ].map(({ value, label, desc, accent, icon }) => {
              const selected = selectedRole === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => setSelectedRole(value)}
                  className="p-4 rounded-2xl text-left transition-all duration-200 hover:scale-[1.02]"
                  style={
                    selected
                      ? {
                          backgroundColor: `${accent}12`,
                          border: `1.5px solid ${accent}`,
                          boxShadow: `0 4px 14px ${accent}25`,
                        }
                      : {
                          backgroundColor: "rgba(255,255,255,0.65)",
                          border: "1px solid rgba(15,34,41,0.10)",
                        }
                  }
                >
                  <div className="mb-2">{icon}</div>
                  <p
                    className="text-sm font-headline"
                    style={{ color: "#0F2229", fontWeight: 700 }}
                  >
                    {label}
                  </p>
                  <p className="text-xs mt-0.5" style={{ color: "#64748b" }}>
                    {desc}
                  </p>
                </button>
              );
            })}
          </div>

          {/* Display name */}
          <div className="mb-6">
            <label htmlFor="signup_display_name" className={labelClass} style={labelStyle}>
              Display Name
            </label>
            <input
              id="signup_display_name"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              minLength={2}
              maxLength={50}
              placeholder="Your name or studio name"
              className={inputClass}
              style={inputStyle}
            />
          </div>

          <button
            type="button"
            disabled={!selectedRole || displayName.trim().length < 2}
            onClick={() => setSignupStep(2)}
            className="w-full py-3.5 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02] disabled:opacity-30 disabled:hover:scale-100"
            style={{
              backgroundColor: "#FF6130",
              fontWeight: 700,
              boxShadow:
                "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
            }}
          >
            Continue
          </button>
        </>
      )}

      {/* ── SIGN UP — Step 2: Email + Password ── */}
      {mode === "signup" && signupStep === 2 && (
        <>
          <button
            type="button"
            onClick={() => setSignupStep(1)}
            className="text-xs transition-colors mb-6 flex items-center gap-1.5 font-headline"
            style={{ color: "#64748b" }}
          >
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M19 12H5M12 19l-7-7 7-7" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            Back
          </button>

          <h1
            className="text-2xl font-headline tracking-tight mb-1"
            style={{ color: "#0F2229", fontWeight: 700, letterSpacing: "-0.02em" }}
          >
            Create your account.
          </h1>
          <div className="flex items-center gap-2 mb-8">
            <div
              className="w-1.5 h-1.5 rounded-full"
              style={{ backgroundColor: selectedRole === "creator" ? "#FF6130" : "#0891b2" }}
            />
            <span
              className="text-xs font-headline uppercase tracking-widest"
              style={{ color: "#94a3b8", fontWeight: 700 }}
            >
              {selectedRole === "creator" ? "Creator" : "Participant"} · {displayName}
            </span>
          </div>

          {signUpState?.error && (
            <div
              className="mb-6 p-3 rounded-xl"
              style={{
                backgroundColor: "rgba(255,97,48,0.10)",
                border: "1px solid rgba(255,97,48,0.30)",
              }}
            >
              <p className="text-sm" style={{ color: "#FF6130" }}>
                {signUpState.error}
              </p>
            </div>
          )}

          <form action={signUpAction} className="space-y-4">
            {/* Hidden fields — role and display_name set in step 1 */}
            <input type="hidden" name="role" value={selectedRole ?? ""} />
            <input type="hidden" name="display_name" value={displayName} />

            <div>
              <label htmlFor="signup_email" className={labelClass} style={labelStyle}>
                Email
              </label>
              <input
                id="signup_email"
                name="email"
                type="email"
                required
                autoComplete="email"
                placeholder="you@example.com"
                className={inputClass}
                style={inputStyle}
              />
            </div>
            <div>
              <label htmlFor="signup_password" className={labelClass} style={labelStyle}>
                Password
              </label>
              <input
                id="signup_password"
                name="password"
                type="password"
                required
                autoComplete="new-password"
                placeholder="Min. 8 characters"
                minLength={8}
                className={inputClass}
                style={inputStyle}
              />
            </div>

            <button
              type="submit"
              disabled={signUpPending}
              className="w-full mt-2 py-3.5 rounded-full text-white text-sm font-headline transition-transform hover:scale-[1.02] disabled:opacity-50 disabled:hover:scale-100"
              style={{
                backgroundColor: "#FF6130",
                fontWeight: 700,
                boxShadow:
                  "0 4px 14px rgba(255,97,48,0.35), 0 2px 6px rgba(255,97,48,0.20)",
              }}
            >
              {signUpPending ? "..." : "Create Account"}
            </button>
          </form>
        </>
      )}

      {/* Switch mode link */}
      <p className="text-center text-xs mt-6" style={{ color: "#94a3b8" }}>
        {mode === "signin" ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => switchMode(mode === "signin" ? "signup" : "signin")}
          className="transition-colors hover:opacity-80"
          style={{ color: "#0891b2", fontWeight: 700 }}
        >
          {mode === "signin" ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
