"use client";

import { useState, useEffect, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

interface Props {
  conversationId: string;
  currentUserId: string;
  profiles: Record<string, { name: string; avatar: string | null }>;
}

interface Message {
  id: string;
  author_id: string;
  body: string;
  created_at: string;
  kind?: "user" | "system";
  metadata?: Record<string, unknown> | null;
}

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const diffH = Math.floor((now.getTime() - d.getTime()) / 3600000);

  if (diffH < 24) {
    return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
  }
  return d.toLocaleDateString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

export function WorkspaceChat({ conversationId, currentUserId, profiles }: Props) {
  const [messages, setMessages] = useState<Message[]>([]);
  const [loading, setLoading] = useState(true);
  const [newMessage, setNewMessage] = useState("");
  const [sending, setSending] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Centralized refetch — initial load + local "activity" signal from
  // WorkspaceEditor after mutations. Idempotent; compares by id/length.
  async function refetchMessages(scroll: boolean = false) {
    const supabase = createClient();
    const { data } = await supabase.rpc("list_dm_messages", {
      p_conversation_id: conversationId,
      p_limit: 100,
    });
    if (!data) return;
    setMessages((prev) => {
      if (prev.length === data.length && prev.every((m, i) => m.id === data[i].id)) {
        return prev;
      }
      if (scroll) {
        setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
      }
      return data;
    });
  }

  // Initial load
  useEffect(() => {
    (async () => {
      await refetchMessages(true);
      setLoading(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  // Realtime subscription — the scalable path for the remote party.
  // Table is in supabase_realtime publication with REPLICA IDENTITY FULL.
  // Status callback logs connect failures so we can diagnose rather than
  // mask them with polling.
  useEffect(() => {
    const supabase = createClient();
    const channel = supabase
      .channel(`dm-${conversationId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "app_dm_message",
          filter: `conversation_id=eq.${conversationId}`,
        },
        (payload) => {
          const msg = payload.new as Message;
          setMessages((prev) => {
            if (prev.some((m) => m.id === msg.id)) return prev;
            return [...prev, msg];
          });
          setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 100);
        }
      )
      .subscribe((status, err) => {
        if (status === "CHANNEL_ERROR" || status === "TIMED_OUT" || status === "CLOSED") {
          // Log so we can diagnose instead of silently falling back
          // eslint-disable-next-line no-console
          console.warn("[WorkspaceChat] Realtime subscription", status, err);
        }
      });

    return () => { supabase.removeChannel(channel); };
  }, [conversationId]);

  // Local actor signal — WorkspaceEditor dispatches `workspace-activity`
  // after every mutation so the acting user sees their own system message
  // land without a round trip over Realtime. Zero network cost.
  useEffect(() => {
    function handler() { refetchMessages(true); }
    window.addEventListener("workspace-activity", handler);
    return () => window.removeEventListener("workspace-activity", handler);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [conversationId]);

  async function handleSend() {
    if (!newMessage.trim() || sending) return;
    const body = newMessage.trim();
    setNewMessage("");
    setSending(true);

    const supabase = createClient();
    const { error } = await supabase.rpc("dm_send", {
      p_conversation_id: conversationId,
      p_body: body,
    });

    if (error) {
      console.error("dm_send failed:", error.message);
    }

    // Fetch fresh in case Realtime didn't fire yet
    const { data } = await supabase.rpc("list_dm_messages", {
      p_conversation_id: conversationId,
      p_limit: 100,
    });
    if (data) {
      setMessages(data);
      setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 50);
    }

    setSending(false);
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  }

  return (
    <div className="rounded-2xl infitra-card flex flex-col" style={{ height: "calc(100vh - 140px)", minHeight: "400px" }}>
      {/* Header */}
      <div className="p-4 border-b" style={{ borderColor: "rgba(15,34,41,0.06)" }}>
        <h3 className="text-sm font-black font-headline text-[#0F2229]">Chat</h3>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {loading ? (
          <p className="text-xs text-[#94a3b8] text-center py-8">Loading...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs text-[#94a3b8] text-center py-8">Start the conversation!</p>
        ) : (
          messages.map((msg) => {
            // System messages — full-width, centered, no bubble, italic.
            if (msg.kind === "system") {
              const actorName = profiles[msg.author_id]?.name ?? "Someone";
              return (
                <div key={msg.id} className="flex items-center gap-2 py-1">
                  <div className="flex-1 h-px" style={{ backgroundColor: "rgba(15,34,41,0.06)" }} />
                  <p className="text-[10px] italic text-[#94a3b8] text-center px-2 leading-tight">
                    <span className="font-semibold">{actorName}</span>{" "}{msg.body}
                    <span className="ml-1.5 not-italic">·</span>{" "}
                    <span className="not-italic">{formatTime(msg.created_at)}</span>
                  </p>
                  <div className="flex-1 h-px" style={{ backgroundColor: "rgba(15,34,41,0.06)" }} />
                </div>
              );
            }

            const isMe = msg.author_id === currentUserId;
            const profile = profiles[msg.author_id];
            return (
              <div key={msg.id} className={`flex gap-2 ${isMe ? "flex-row-reverse" : ""}`}>
                {!isMe && (
                  profile?.avatar ? (
                    <img src={profile.avatar} alt="" className="w-7 h-7 rounded-full object-cover shrink-0" />
                  ) : (
                    <div className="w-7 h-7 rounded-full bg-cyan-100 flex items-center justify-center shrink-0">
                      <span className="text-[10px] font-black text-cyan-700">{profile?.name?.[0] ?? "?"}</span>
                    </div>
                  )
                )}
                <div className={`max-w-[75%] ${isMe ? "text-right" : ""}`}>
                  <div
                    className={`inline-block px-3 py-2 rounded-2xl text-sm ${
                      isMe
                        ? "rounded-br-md text-white"
                        : "rounded-bl-md text-[#0F2229]"
                    }`}
                    style={{
                      backgroundColor: isMe ? "#0891b2" : "rgba(0,0,0,0.04)",
                    }}
                  >
                    {msg.body}
                  </div>
                  <p className="text-[9px] text-[#94a3b8] mt-0.5 px-1">{formatTime(msg.created_at)}</p>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      {/* Composer */}
      <div className="p-3 border-t" style={{ borderColor: "rgba(15,34,41,0.06)" }}>
        <div className="flex gap-2">
          <textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            rows={1}
            className="flex-1 rounded-xl px-3 py-2 text-sm resize-none focus:outline-none"
            style={{ backgroundColor: "rgba(0,0,0,0.03)", border: "1px solid rgba(15,34,41,0.08)", color: "#0F2229" }}
          />
          <button
            onClick={handleSend}
            disabled={sending || !newMessage.trim()}
            className="px-4 py-2 rounded-xl text-white text-sm font-bold disabled:opacity-40 shrink-0"
            style={{ backgroundColor: "#0891b2" }}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
