"use client";

import { useState, useRef } from "react";
import { UnsplashPicker } from "./UnsplashPicker";
import { BrandedCover } from "./BrandedCover";

interface ImageSelectorProps {
  currentUrl: string | null;
  title?: string;
  onSelect: (url: string | null) => void;
  size?: "sm" | "md" | "lg";
}

/**
 * ImageSelector — three-tier image selection.
 * 1. INFITRA branded default (always looks good)
 * 2. Unsplash search (free professional photos)
 * 3. Custom upload (creator's own image)
 */
export function ImageSelector({
  currentUrl,
  title,
  onSelect,
  size = "md",
}: ImageSelectorProps) {
  const [showUnsplash, setShowUnsplash] = useState(false);
  const [credit, setCredit] = useState<{ name: string; link: string } | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      alert("Image must be under 5MB");
      return;
    }

    setUploading(true);
    try {
      const { createClient } = await import("@/lib/supabase/client");
      const supabase = createClient();
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
      const path = `${user.id}/content-${Date.now()}.${ext}`;
      const { error } = await supabase.storage.from("profile-images").upload(path, file, { upsert: true, contentType: file.type });
      if (error) { alert(`Upload failed: ${error.message}`); return; }

      const { data: urlData } = supabase.storage.from("profile-images").getPublicUrl(path);
      onSelect(urlData.publicUrl);
      setCredit(null);
    } catch (err: any) {
      alert(err?.message || "Upload failed");
    }
    setUploading(false);
  }

  const heights = { sm: "h-24", md: "h-40", lg: "h-56" };

  return (
    <div>
      {/* Preview */}
      <div className={`relative rounded-xl overflow-hidden ${heights[size]} mb-3 group`}>
        {currentUrl ? (
          <img src={currentUrl} alt="" className="w-full h-full object-cover" />
        ) : (
          <BrandedCover title={title} size={size} />
        )}

        {/* Overlay actions */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 flex items-center justify-center gap-3 opacity-0 group-hover:opacity-100">
          <button
            onClick={() => setShowUnsplash(true)}
            className="px-4 py-2 rounded-full text-xs font-bold font-headline text-white"
            style={{ backgroundColor: "#FF6130" }}
          >
            Browse Photos
          </button>
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="px-4 py-2 rounded-full text-xs font-bold font-headline text-white"
            style={{ backgroundColor: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)" }}
          >
            {uploading ? "..." : "Upload"}
          </button>
          {currentUrl && (
            <button
              onClick={() => { onSelect(null); setCredit(null); }}
              className="px-3 py-2 rounded-full text-xs font-bold font-headline text-white/60 hover:text-white"
            >
              Reset
            </button>
          )}
        </div>
      </div>

      {/* Credit */}
      {credit && (
        <p className="text-[10px] text-[#9CF0FF]/40">
          Photo by <a href={credit.link} target="_blank" rel="noopener noreferrer" className="underline">{credit.name}</a> on <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline">Unsplash</a>
        </p>
      )}

      <input ref={fileRef} type="file" accept="image/jpeg,image/png,image/webp" className="hidden" onChange={handleFileUpload} />

      {/* Unsplash modal */}
      {showUnsplash && (
        <UnsplashPicker
          onSelect={(url, c) => {
            onSelect(url);
            setCredit(c);
            setShowUnsplash(false);
          }}
          onClose={() => setShowUnsplash(false)}
        />
      )}
    </div>
  );
}
