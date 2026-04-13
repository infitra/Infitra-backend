"use client";

import { useState } from "react";
import { ImageSelector } from "@/app/components/ImageSelector";
import { updateTribeCover } from "@/app/actions/challenge";

export function TribeCoverEditor({
  spaceId,
  currentCoverUrl,
  tribeName,
}: {
  spaceId: string;
  currentCoverUrl: string | null;
  tribeName: string;
}) {
  const [coverUrl, setCoverUrl] = useState(currentCoverUrl);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);

  async function handleSave(url: string | null) {
    setCoverUrl(url);
    setSaving(true);
    await updateTribeCover(spaceId, url);
    setSaving(false);
    setEditing(false);
  }

  if (!editing) {
    return (
      <button
        onClick={() => setEditing(true)}
        className="absolute bottom-3 right-4 px-3 py-1.5 rounded-full text-[10px] font-bold font-headline text-white/70 hover:text-white z-10"
        style={{ backgroundColor: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.15)" }}
      >
        {coverUrl ? "Change Cover" : "+ Add Cover"}
      </button>
    );
  }

  return (
    <div className="absolute inset-0 z-10 bg-black/60 flex items-center justify-center p-6">
      <div className="w-full max-w-lg">
        <ImageSelector
          currentUrl={coverUrl}
          title={tribeName}
          onSelect={handleSave}
          size="lg"
        />
        <button
          onClick={() => setEditing(false)}
          className="mt-3 text-xs text-white/50 hover:text-white font-headline"
        >
          Cancel
        </button>
      </div>
    </div>
  );
}
