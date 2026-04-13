"use client";

import { useState, useCallback } from "react";

interface UnsplashPhoto {
  id: string;
  urls: { regular: string; small: string; thumb: string };
  user: { name: string; links: { html: string } };
  alt_description: string | null;
}

interface UnsplashPickerProps {
  onSelect: (imageUrl: string, credit: { name: string; link: string }) => void;
  onClose: () => void;
}

/**
 * UnsplashPicker — search and select free images from Unsplash.
 * Requires NEXT_PUBLIC_UNSPLASH_ACCESS_KEY environment variable.
 * Attribution is included per Unsplash API terms.
 */
export function UnsplashPicker({ onSelect, onClose }: UnsplashPickerProps) {
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [searched, setSearched] = useState(false);

  const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

  const search = useCallback(async () => {
    if (!query.trim() || !accessKey) return;
    setLoading(true);
    setSearched(true);
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query)}&per_page=20&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      );
      const data = await res.json();
      setPhotos(data.results ?? []);
    } catch {
      setPhotos([]);
    }
    setLoading(false);
  }, [query, accessKey]);

  function handleSelect(photo: UnsplashPhoto) {
    // Trigger download endpoint per Unsplash API guidelines
    if (accessKey) {
      fetch(`https://api.unsplash.com/photos/${photo.id}/download`, {
        headers: { Authorization: `Client-ID ${accessKey}` },
      }).catch(() => {});
    }
    onSelect(photo.urls.regular, {
      name: photo.user.name,
      link: photo.user.links.html,
    });
  }

  return (
    <div className="fixed inset-0 z-[90] flex items-center justify-center">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50" onClick={onClose} />

      {/* Modal */}
      <div
        className="relative w-full max-w-3xl max-h-[80vh] rounded-2xl overflow-hidden flex flex-col"
        style={{ backgroundColor: "#0d1f28", border: "1px solid #1a3340" }}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between" style={{ borderBottom: "1px solid #1a3340" }}>
          <h3 className="text-base font-bold font-headline text-white">Choose an Image</h3>
          <button onClick={onClose} className="text-[#9CF0FF]/50 hover:text-white p-1">
            <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
              <path d="M18 6L6 18M6 6l12 12" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </button>
        </div>

        {/* Search */}
        <div className="px-6 py-4">
          <div className="flex gap-2">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && search()}
              placeholder="Search free photos... (e.g. fitness, yoga, running)"
              className="flex-1 px-4 py-2.5 rounded-xl text-sm text-white focus:outline-none"
              style={{ backgroundColor: "#0a1218", border: "1px solid #1a3340" }}
              autoFocus
            />
            <button
              onClick={search}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-bold font-headline text-white disabled:opacity-50"
              style={{ backgroundColor: "#FF6130" }}
            >
              {loading ? "..." : "Search"}
            </button>
          </div>
        </div>

        {/* Results */}
        <div className="flex-1 overflow-y-auto px-6 pb-6">
          {loading && (
            <div className="flex items-center justify-center py-16">
              <div className="w-6 h-6 rounded-full border-2 border-[#FF6130]/30 border-t-[#FF6130] animate-spin" />
            </div>
          )}

          {!loading && searched && photos.length === 0 && (
            <p className="text-center text-sm text-[#9CF0FF]/50 py-16">No photos found. Try a different search.</p>
          )}

          {!loading && photos.length > 0 && (
            <>
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {photos.map((photo) => (
                  <button
                    key={photo.id}
                    onClick={() => handleSelect(photo)}
                    className="relative rounded-xl overflow-hidden aspect-[3/2] group"
                  >
                    <img
                      src={photo.urls.small}
                      alt={photo.alt_description ?? ""}
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/30 flex items-center justify-center opacity-0 group-hover:opacity-100">
                      <span className="text-xs font-bold text-white bg-[#FF6130] px-3 py-1.5 rounded-full">Select</span>
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-2 bg-gradient-to-t from-black/60 to-transparent">
                      <p className="text-[10px] text-white/70 truncate">{photo.user.name}</p>
                    </div>
                  </button>
                ))}
              </div>
              <p className="text-center text-[10px] text-[#9CF0FF]/30 mt-4">
                Photos by <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline">Unsplash</a>
              </p>
            </>
          )}

          {!loading && !searched && (
            <div className="text-center py-16">
              <p className="text-sm text-[#9CF0FF]/50 mb-2">Search for free professional photos</p>
              <p className="text-xs text-[#9CF0FF]/30">Try: fitness, workout, yoga, running, gym, strength</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
