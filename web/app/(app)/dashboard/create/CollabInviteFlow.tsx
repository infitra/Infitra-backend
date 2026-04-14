"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { sendCollabInvite } from "@/app/actions/collaboration";
import { ShareDonut } from "@/app/components/ShareDonut";

interface CreatorResult {
  id: string;
  display_name: string;
  avatar_url: string | null;
  tagline: string | null;
}

export function CollabInviteFlow() {
  const [step, setStep] = useState<"idle" | "search" | "compose" | "sent">("idle");
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CreatorResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<CreatorResult | null>(null);
  const [split, setSplit] = useState(50);
  const [message, setMessage] = useState("");
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const supabase = createClient();
    const { data } = await supabase
      .from("app_profile")
      .select("id, display_name, avatar_url, tagline")
      .eq("role", "creator")
      .ilike("display_name", `%${q}%`)
      .limit(5);
    setResults(data ?? []);
    setSearching(false);
  }

  function handleSelect(creator: CreatorResult) {
    setSelected(creator);
    setStep("compose");
    setResults([]);
    setQuery("");
  }

  async function handleSend() {
    if (!selected || !message.trim()) return;
    setSending(true);
    setError(null);
    const result = await sendCollabInvite(selected.id, message, split);
    if (result.error) { setError(result.error); setSending(false); return; }
    setStep("sent");
    setSending(false);
  }

  if (step === "sent") {
    return (
      <div className="text-center py-4">
        <p className="text-sm font-bold font-headline text-[#0F2229] mb-1">Invite sent!</p>
        <p className="text-xs text-[#64748b]">You&apos;ll be notified when {selected?.display_name} responds.</p>
        <button onClick={() => { setStep("idle"); setSelected(null); setMessage(""); setSplit(50); }} className="text-xs font-bold font-headline text-[#FF6130] mt-3">
          Send another
        </button>
      </div>
    );
  }

  if (step === "idle") {
    return (
      <button
        onClick={() => setStep("search")}
        className="px-6 py-3 rounded-full text-sm font-black font-headline w-full"
        style={{ color: "#0891b2", border: "2px solid #9CF0FF", backgroundColor: "rgba(156,240,255,0.08)" }}
      >
        Invite a Creator
      </button>
    );
  }

  if (step === "search") {
    return (
      <div>
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder="Search creators by name..."
          autoFocus
          className="w-full rounded-xl p-3 text-sm focus:outline-none mb-2"
          style={{ border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }}
        />
        {searching && <p className="text-xs text-[#94a3b8] py-2">Searching...</p>}
        {results.length > 0 && (
          <div className="space-y-1">
            {results.map((c) => (
              <button
                key={c.id}
                onClick={() => handleSelect(c)}
                className="w-full flex items-center gap-3 p-3 rounded-xl text-left group hover:bg-white/50"
              >
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-black font-headline text-cyan-700">{c.display_name[0]}</span>
                  </div>
                )}
                <div className="min-w-0">
                  <p className="text-sm font-bold font-headline text-[#0F2229] truncate">{c.display_name}</p>
                  {c.tagline && <p className="text-[10px] text-[#94a3b8] truncate">{c.tagline}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
        {query.length >= 2 && !searching && results.length === 0 && (
          <p className="text-xs text-[#94a3b8] py-4 text-center">No creators found</p>
        )}
        <button onClick={() => setStep("idle")} className="text-xs text-[#94a3b8] mt-3 hover:text-[#0F2229]">Cancel</button>
      </div>
    );
  }

  // step === "compose"
  return (
    <div>
      {/* Selected creator */}
      <div className="flex items-center gap-3 mb-4">
        {selected?.avatar_url ? (
          <img src={selected.avatar_url} alt="" className="w-10 h-10 rounded-full object-cover shrink-0" />
        ) : (
          <div className="w-10 h-10 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
            <span className="text-sm font-black font-headline text-cyan-700">{selected?.display_name[0]}</span>
          </div>
        )}
        <div className="min-w-0">
          <p className="text-sm font-bold font-headline text-[#0F2229]">{selected?.display_name}</p>
          <button onClick={() => setStep("search")} className="text-[10px] text-[#FF6130]">Change</button>
        </div>
      </div>

      {/* Share split */}
      <div className="mb-4">
        <ShareDonut
          size={100}
          shares={[
            { label: "You", percent: 100 - split, color: "#FF6130" },
            { label: selected?.display_name ?? "Partner", percent: split, color: "#9CF0FF" },
          ]}
        />
        <div className="flex items-center gap-3 mt-3">
          <label className="text-xs font-bold font-headline text-[#94a3b8]">Their share:</label>
          <input
            type="range"
            min={10}
            max={90}
            value={split}
            onChange={(e) => setSplit(Number(e.target.value))}
            className="flex-1 accent-[#9CF0FF]"
          />
          <span className="text-sm font-black font-headline text-[#0F2229] w-10 text-right">{split}%</span>
        </div>
      </div>

      {/* Message */}
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        placeholder="Hey! I have an idea for a collaboration..."
        rows={3}
        className="w-full rounded-xl p-3 text-sm focus:outline-none resize-none mb-3"
        style={{ border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }}
      />

      {error && <p className="text-xs text-[#FF6130] mb-2">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSend}
          disabled={sending || !message.trim()}
          className="flex-1 px-5 py-2.5 rounded-full text-white text-sm font-black font-headline disabled:opacity-40"
          style={{ backgroundColor: "#0891b2" }}
        >
          {sending ? "Sending..." : "Send Invite"}
        </button>
        <button onClick={() => { setStep("idle"); setSelected(null); }} className="text-xs text-[#94a3b8] hover:text-[#0F2229] px-3">
          Cancel
        </button>
      </div>
    </div>
  );
}
