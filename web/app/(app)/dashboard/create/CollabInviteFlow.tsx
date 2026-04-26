"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { sendCollabInvites, sendAdditionalCollabInvite } from "@/app/actions/collaboration";
import { ShareDonut } from "@/app/components/ShareDonut";

interface CreatorResult {
  id: string;
  display_name: string;
  avatar_url: string | null;
  tagline: string | null;
}

interface SelectedInvitee {
  id: string;
  display_name: string;
  avatar_url: string | null;
  splitPercent: number;
}

interface Props {
  existingChallengeId?: string;
  existingCollaboratorIds?: string[]; // IDs to exclude from search (already on the workspace)
  onSent?: () => void;
  /** When true (used on /dashboard/create), the trigger button renders as the
   *  filled orange primary CTA — Collaboration is the headline action there. */
  primary?: boolean;
}

export function CollabInviteFlow({ existingChallengeId, existingCollaboratorIds, onSent, primary }: Props) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<CreatorResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [invitees, setInvitees] = useState<SelectedInvitee[]>([]);
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [showSplit, setShowSplit] = useState(false);
  // Tracks whether the user has actually engaged with the split UI.
  // splitPercent gets sent as 0 for everyone if this stays false →
  // the dashboard then renders "no split proposed yet" instead of
  // dressing up an arbitrary auto-default as a real proposal.
  const [splitEngaged, setSplitEngaged] = useState(false);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isAdditional = !!existingChallengeId;

  async function handleSearch(q: string) {
    setQuery(q);
    if (q.length < 2) { setResults([]); return; }
    setSearching(true);
    const supabase = createClient();
    const exclude = [...(existingCollaboratorIds ?? []), ...invitees.map(i => i.id)];
    let queryBuilder = supabase
      .from("app_profile")
      .select("id, display_name, avatar_url, tagline")
      .eq("role", "creator")
      .ilike("display_name", `%${q}%`)
      .limit(5);
    if (exclude.length > 0) {
      queryBuilder = queryBuilder.not("id", "in", `(${exclude.join(",")})`);
    }
    const { data } = await queryBuilder;
    setResults(data ?? []);
    setSearching(false);
  }

  function addInvitee(creator: CreatorResult) {
    // Only auto-distribute splits if the user has explicitly engaged
    // with the split UI. Otherwise leave at 0 (= "no split proposed").
    const newCount = invitees.length + 1;
    if (splitEngaged) {
      const evenSplit = Math.floor(80 / newCount);
      setInvitees([
        ...invitees.map(i => ({ ...i, splitPercent: evenSplit })),
        { id: creator.id, display_name: creator.display_name, avatar_url: creator.avatar_url, splitPercent: evenSplit },
      ]);
    } else {
      setInvitees([
        ...invitees,
        { id: creator.id, display_name: creator.display_name, avatar_url: creator.avatar_url, splitPercent: 0 },
      ]);
    }
    setQuery("");
    setResults([]);
  }

  function toggleSplit() {
    if (!splitEngaged) {
      // First time the user opens the split section — populate the
      // sliders with sensible defaults so they're not all sitting at 0.
      // From this point, splits are part of the proposal.
      const newCount = invitees.length;
      const evenSplit = newCount > 0 ? Math.floor(80 / newCount) : 0;
      setInvitees(invitees.map(i => ({ ...i, splitPercent: evenSplit })));
      setSplitEngaged(true);
    }
    setShowSplit(!showSplit);
  }

  function removeInvitee(id: string) {
    setInvitees(invitees.filter(i => i.id !== id));
  }

  function updateSplit(id: string, percent: number) {
    setInvitees(invitees.map(i => i.id === id ? { ...i, splitPercent: percent } : i));
  }

  async function handleSend() {
    if (invitees.length === 0) { setError("Select at least one creator."); return; }
    if (!message.trim()) { setError("Please write a message about your idea."); return; }
    setSending(true); setError(null);

    if (isAdditional && existingChallengeId) {
      // Only one invitee at a time in additional mode (simpler)
      for (const inv of invitees) {
        const result = await sendAdditionalCollabInvite({
          challengeId: existingChallengeId,
          toId: inv.id,
          message,
          splitPercent: inv.splitPercent,
        });
        if (result.error) { setError(result.error); setSending(false); return; }
      }
      setSending(false);
      setOpen(false);
      setInvitees([]);
      setMessage("");
      if (onSent) onSent();
      router.refresh();
    } else {
      const result = await sendCollabInvites({
        title: title.trim() || undefined,
        message,
        invitees: invitees.map(i => ({ toId: i.id, splitPercent: i.splitPercent })),
      });
      if (result.error) { setError(result.error); setSending(false); return; }
      setSending(false);
      router.push(`/dashboard/collaborate/${(result as any).challengeId}`);
    }
  }

  const ownerSplit = 100 - invitees.reduce((a, b) => a + b.splitPercent, 0);
  const shares = [
    { label: "You", percent: ownerSplit, color: "#FF6130" },
    ...invitees.map((i, idx) => ({ label: i.display_name, percent: i.splitPercent, color: idx === 0 ? "#9CF0FF" : idx === 1 ? "#0891b2" : "#a78bfa" })),
  ];

  // Compact trigger button
  if (!open) {
    // Three trigger styles:
    //   isAdditional → small cyan ghost ("Invite more" inside an existing workspace)
    //   primary       → filled orange CTA (Create page hero treatment)
    //   default       → cyan outlined ghost (legacy fallback)
    const triggerClass = isAdditional
      ? "px-4 py-2 rounded-full text-xs font-bold font-headline text-[#0891b2]"
      : "px-6 py-3 rounded-full text-sm font-black font-headline w-full";

    const triggerStyle: React.CSSProperties = isAdditional
      ? { border: "1px solid rgba(8,145,178,0.30)", backgroundColor: "rgba(156,240,255,0.10)" }
      : primary
        ? {
            color: "#FFFFFF",
            backgroundColor: "#FF6130",
            boxShadow: "0 4px 14px rgba(255,97,48,0.35)",
          }
        : { color: "#0891b2", border: "2px solid #9CF0FF", backgroundColor: "rgba(156,240,255,0.08)" };

    return (
      <button onClick={() => setOpen(true)} className={triggerClass} style={triggerStyle}>
        {isAdditional ? "+ Invite More" : "Invite Creators"}
      </button>
    );
  }

  return (
    <div className="space-y-4">
      <div>
        <h4 className="text-sm font-black font-headline text-[#0F2229] mb-1">
          {isAdditional ? "Invite Another Collaborator" : "Invite to Collaborate"}
        </h4>
        <p className="text-xs text-[#94a3b8]">
          A simple human ask. Details can be worked out together in the workspace.
        </p>
      </div>

      {/* Selected invitees chips */}
      {invitees.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {invitees.map((inv) => (
            <div key={inv.id} className="flex items-center gap-2 px-3 py-1.5 rounded-full" style={{ backgroundColor: "rgba(156,240,255,0.12)", border: "1px solid rgba(156,240,255,0.25)" }}>
              {inv.avatar_url ? (
                <img src={inv.avatar_url} alt="" className="w-6 h-6 rounded-full object-cover" />
              ) : (
                <div className="w-6 h-6 rounded-full bg-cyan-100 flex items-center justify-center">
                  <span className="text-[10px] font-black text-cyan-700">{inv.display_name[0]}</span>
                </div>
              )}
              <span className="text-xs font-bold font-headline text-[#0F2229]">{inv.display_name}</span>
              <button onClick={() => removeInvitee(inv.id)} className="text-[#94a3b8] hover:text-[#0F2229] text-xs">✕</button>
            </div>
          ))}
        </div>
      )}

      {/* Search */}
      <div>
        <input
          value={query}
          onChange={(e) => handleSearch(e.target.value)}
          placeholder={invitees.length > 0 && !isAdditional ? "Add more creators..." : "Search creators by name..."}
          autoFocus
          className="w-full rounded-xl p-3 text-sm focus:outline-none"
          style={{ border: "1px solid rgba(15,34,41,0.12)", color: "#0F2229" }}
        />
        {searching && <p className="text-xs text-[#94a3b8] py-2">Searching...</p>}
        {results.length > 0 && (
          <div className="space-y-1 mt-2 rounded-xl overflow-hidden" style={{ border: "1px solid rgba(15,34,41,0.08)" }}>
            {results.map((c) => (
              <button
                key={c.id}
                onClick={() => addInvitee(c)}
                disabled={isAdditional && invitees.length > 0}
                className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/50 disabled:opacity-40"
              >
                {c.avatar_url ? (
                  <img src={c.avatar_url} alt="" className="w-9 h-9 rounded-full object-cover shrink-0" />
                ) : (
                  <div className="w-9 h-9 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                    <span className="text-sm font-black text-cyan-700">{c.display_name[0]}</span>
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-bold font-headline text-[#0F2229] truncate">{c.display_name}</p>
                  {c.tagline && <p className="text-[10px] text-[#94a3b8] truncate">{c.tagline}</p>}
                </div>
              </button>
            ))}
          </div>
        )}
        {query.length >= 2 && !searching && results.length === 0 && (
          <p className="text-xs text-[#94a3b8] py-3 text-center">No creators found</p>
        )}
      </div>

      {invitees.length > 0 && (
        <>
          {/* Optional title (only for new collab) */}
          {!isAdditional && (
            <div>
              <label className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-1">
                Idea / Title (optional)
              </label>
              <input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. 30-Day Power HIIT"
                className="w-full rounded-xl p-3 text-sm focus:outline-none"
                style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
              />
            </div>
          )}

          {/* Message */}
          <div>
            <label className="text-[10px] font-bold font-headline text-[#94a3b8] uppercase tracking-wider block mb-1">
              Your Pitch
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Hey! I have an idea I think we should explore together..."
              rows={3}
              className="w-full rounded-xl p-3 text-sm focus:outline-none resize-none"
              style={{ border: "1px solid rgba(15,34,41,0.10)", color: "#0F2229" }}
            />
          </div>

          {/* Optional revenue split */}
          <div>
            <button
              onClick={toggleSplit}
              className="text-xs font-bold font-headline text-[#94a3b8] hover:text-[#0F2229]"
            >
              {showSplit ? "▼" : "▸"} Add suggested revenue split (optional)
            </button>
            {showSplit && (
              <div className="mt-3 p-4 rounded-xl" style={{ backgroundColor: "rgba(0,0,0,0.02)", border: "1px solid rgba(0,0,0,0.06)" }}>
                <p className="text-[10px] text-[#94a3b8] mb-3">
                  Non-binding suggestion — you&apos;ll finalize terms together in the workspace.
                </p>
                <div className="flex items-start gap-4">
                  <ShareDonut size={80} shares={shares} />
                  <div className="flex-1 space-y-2">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold font-headline text-[#0F2229]">You</span>
                      <span className="font-black font-headline text-[#FF6130]">{ownerSplit}%</span>
                    </div>
                    {invitees.map((inv) => (
                      <div key={inv.id} className="flex items-center gap-2">
                        <span className="text-xs font-bold font-headline text-[#0F2229] w-24 truncate">{inv.display_name}</span>
                        <input
                          type="range" min={0} max={100} value={inv.splitPercent}
                          onChange={(e) => updateSplit(inv.id, Number(e.target.value))}
                          className="flex-1 accent-[#9CF0FF]"
                        />
                        <span className="text-xs font-black font-headline text-[#0891b2] w-10 text-right">{inv.splitPercent}%</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}
          </div>
        </>
      )}

      {error && <p className="text-xs text-[#FF6130]">{error}</p>}

      <div className="flex items-center gap-2">
        <button
          onClick={handleSend}
          disabled={sending || invitees.length === 0 || !message.trim()}
          className="flex-1 px-5 py-2.5 rounded-full text-white text-sm font-black font-headline disabled:opacity-40"
          style={{ backgroundColor: "#0891b2" }}
        >
          {sending ? "Sending..." : isAdditional ? "Send Invitation" : `Send ${invitees.length > 1 ? `${invitees.length} Invitations` : "Invitation"}`}
        </button>
        <button
          onClick={() => { setOpen(false); setInvitees([]); setMessage(""); setTitle(""); }}
          className="text-xs text-[#94a3b8] hover:text-[#0F2229] px-3"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
