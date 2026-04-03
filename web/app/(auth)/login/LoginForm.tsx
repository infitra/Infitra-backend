"use client";

import { useState, useActionState } from "react";
import { signIn, signUp } from "@/app/actions/auth";

export function LoginForm() {
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [signInState, signInAction, signInPending] = useActionState(signIn, null);
  const [signUpState, signUpAction, signUpPending] = useActionState(signUp, null);

  const isSignIn = mode === "signin";
  const action = isSignIn ? signInAction : signUpAction;
  const pending = isSignIn ? signInPending : signUpPending;
  const error = isSignIn ? signInState?.error : signUpState?.error;

  return (
    <div className="bg-[#0F2229] rounded-2xl border border-[#9CF0FF]/10 p-8 md:p-10">
      {/* Tab switcher */}
      <div className="flex mb-8 bg-[#071318] rounded-full p-1">
        <button
          type="button"
          onClick={() => setMode("signin")}
          className={`flex-1 py-2.5 text-sm font-bold font-headline rounded-full transition-all ${
            isSignIn
              ? "bg-[#9CF0FF]/15 text-[#9CF0FF]"
              : "text-[#9CF0FF]/40 hover:text-[#9CF0FF]/60"
          }`}
        >
          Sign In
        </button>
        <button
          type="button"
          onClick={() => setMode("signup")}
          className={`flex-1 py-2.5 text-sm font-bold font-headline rounded-full transition-all ${
            !isSignIn
              ? "bg-[#9CF0FF]/15 text-[#9CF0FF]"
              : "text-[#9CF0FF]/40 hover:text-[#9CF0FF]/60"
          }`}
        >
          Sign Up
        </button>
      </div>

      <h1 className="text-2xl font-black text-white font-headline tracking-tight mb-2">
        {isSignIn ? "Welcome back." : "Join INFITRA."}
      </h1>
      <p className="text-sm text-[#9CF0FF]/40 mb-8">
        {isSignIn
          ? "Sign in to your account."
          : "Create your account to get started."}
      </p>

      {error && (
        <div className="mb-6 p-3 rounded-xl bg-[#FF6130]/10 border border-[#FF6130]/20">
          <p className="text-sm text-[#FF6130]">{error}</p>
        </div>
      )}

      <form action={action} className="space-y-4">
        <div>
          <label
            htmlFor="email"
            className="block text-xs font-bold text-[#9CF0FF]/50 uppercase tracking-wider mb-2 font-headline"
          >
            Email
          </label>
          <input
            id="email"
            name="email"
            type="email"
            required
            autoComplete="email"
            placeholder="you@example.com"
            className="w-full px-4 py-3 rounded-xl bg-[#071318] border border-[#9CF0FF]/15 text-white placeholder-[#9CF0FF]/25 focus:outline-none focus:border-[#9CF0FF]/40 transition-colors text-sm"
          />
        </div>

        <div>
          <label
            htmlFor="password"
            className="block text-xs font-bold text-[#9CF0FF]/50 uppercase tracking-wider mb-2 font-headline"
          >
            Password
          </label>
          <input
            id="password"
            name="password"
            type="password"
            required
            autoComplete={isSignIn ? "current-password" : "new-password"}
            placeholder={isSignIn ? "Your password" : "Min. 8 characters"}
            minLength={isSignIn ? undefined : 8}
            className="w-full px-4 py-3 rounded-xl bg-[#071318] border border-[#9CF0FF]/15 text-white placeholder-[#9CF0FF]/25 focus:outline-none focus:border-[#9CF0FF]/40 transition-colors text-sm"
          />
        </div>

        <button
          type="submit"
          disabled={pending}
          className="w-full mt-2 py-3.5 bg-[#FF6130] text-white rounded-full font-black text-sm hover:scale-[1.02] transition-transform font-headline shadow-[0_0_20px_rgba(255,97,48,0.3)] disabled:opacity-50 disabled:hover:scale-100"
        >
          {pending
            ? "..."
            : isSignIn
              ? "Sign In"
              : "Create Account"}
        </button>
      </form>

      <p className="text-center text-xs text-[#9CF0FF]/25 mt-6">
        {isSignIn ? "Don't have an account? " : "Already have an account? "}
        <button
          type="button"
          onClick={() => setMode(isSignIn ? "signup" : "signin")}
          className="text-[#9CF0FF]/50 hover:text-[#9CF0FF] transition-colors"
        >
          {isSignIn ? "Sign up" : "Sign in"}
        </button>
      </p>
    </div>
  );
}
