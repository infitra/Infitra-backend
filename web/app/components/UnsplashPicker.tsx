"use client";

import { useState, useCallback, useEffect } from "react";
import { createPortal } from "react-dom";

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

// Polish v12.K — quick-pick keyword chips. Two purposes:
//   (a) reduces typing for the common case (most creators are
//       fitness/wellness adjacent so the obvious queries should be
//       one click)
//   (b) gives an "I don't know what I want" affordance — clicking a
//       chip starts a search instead of staring at an empty modal
// Mix of fitness-specific + broader-mood keywords so the picker
// doesn't keep returning the same dumbbells-and-treadmills loop.
const QUICK_QUERIES = [
  "fitness", "yoga", "running", "strength",
  "stretching", "outdoors", "calm", "nature",
  "mountain", "abstract",
];

const PER_PAGE = 30; // Unsplash max — was 20, +50% per fetch for free.

/**
 * UnsplashPicker — search and select free images from Unsplash.
 * Requires NEXT_PUBLIC_UNSPLASH_ACCESS_KEY environment variable.
 * Attribution is included per Unsplash API terms.
 *
 * Polish v12.K behaviour:
 * - First search for a query fetches page 1 (Unsplash relevance-ranked,
 *   so the most "obvious" matches show up first).
 * - "Show more" picks a RANDOM unseen page from [1..total_pages] and
 *   appends results, deduped by photo ID. Random (vs sequential page
 *   2 → 3 → 4) because sequential paging just gives you increasingly
 *   obscure photos; random jumps surface variety from across the full
 *   result space.
 */
export function UnsplashPicker({ onSelect, onClose }: UnsplashPickerProps) {
  const [query, setQuery] = useState("");
  const [photos, setPhotos] = useState<UnsplashPhoto[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [searched, setSearched] = useState(false);
  const [seenPages, setSeenPages] = useState<Set<number>>(new Set());
  const [totalPages, setTotalPages] = useState(0);

  const accessKey = process.env.NEXT_PUBLIC_UNSPLASH_ACCESS_KEY;

  async function fetchPage(searchQuery: string, pageNum: number): Promise<{
    photos: UnsplashPhoto[];
    totalPages: number;
  } | null> {
    if (!searchQuery.trim() || !accessKey) return null;
    try {
      const res = await fetch(
        `https://api.unsplash.com/search/photos?query=${encodeURIComponent(searchQuery)}&per_page=${PER_PAGE}&page=${pageNum}&orientation=landscape`,
        { headers: { Authorization: `Client-ID ${accessKey}` } }
      );
      const data = await res.json();
      return {
        photos: data.results ?? [],
        totalPages: data.total_pages ?? 0,
      };
    } catch {
      return null;
    }
  }

  const search = useCallback(async (overrideQuery?: string) => {
    const q = overrideQuery ?? query;
    if (!q.trim() || !accessKey) return;
    if (overrideQuery !== undefined) setQuery(overrideQuery);
    setLoading(true);
    setSearched(true);
    setPhotos([]);
    setSeenPages(new Set());
    setTotalPages(0);
    const result = await fetchPage(q, 1);
    if (result) {
      setPhotos(result.photos);
      setSeenPages(new Set([1]));
      setTotalPages(result.totalPages);
    } else {
      setPhotos([]);
    }
    setLoading(false);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [query, accessKey]);

  async function showMore() {
    if (loadingMore || totalPages <= 1) return;
    // Random unseen page. If we've seen all pages already, bail.
    const candidates: number[] = [];
    for (let i = 1; i <= totalPages; i++) {
      if (!seenPages.has(i)) candidates.push(i);
    }
    if (candidates.length === 0) return;
    const nextPage = candidates[Math.floor(Math.random() * candidates.length)];
    setLoadingMore(true);
    const result = await fetchPage(query, nextPage);
    if (result) {
      // Dedupe by photo ID — random pages CAN overlap with already-loaded
      // results (Unsplash results aren't strictly disjoint across pages).
      const existingIds = new Set(photos.map((p) => p.id));
      const fresh = result.photos.filter((p) => !existingIds.has(p.id));
      setPhotos([...photos, ...fresh]);
      setSeenPages(new Set([...seenPages, nextPage]));
    }
    setLoadingMore(false);
  }

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

  const moreAvailable = totalPages > seenPages.size;

  // Polish v12.L.1: portal to body so the picker isn't clipped or
  // re-positioned by any ancestor's transform / filter context (it
  // opens from within ImageSelector, which is itself nested inside
  // the Dialog primitive — without portaling, fixed positioning was
  // unreliable).
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  if (!mounted) return null;

  return createPortal(
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
        <div className="px-6 py-4 space-y-3">
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
              onClick={() => search()}
              disabled={loading}
              className="px-5 py-2.5 rounded-xl text-sm font-bold font-headline text-white disabled:opacity-50"
              style={{ backgroundColor: "#FF6130" }}
            >
              {loading ? "..." : "Search"}
            </button>
          </div>
          {/* Quick-pick chips — polish v12.K */}
          <div className="flex flex-wrap gap-1.5">
            {QUICK_QUERIES.map((q) => (
              <button
                key={q}
                onClick={() => search(q)}
                disabled={loading}
                className="px-2.5 py-1 rounded-full text-[11px] font-bold font-headline text-[#9CF0FF] hover:text-white hover:bg-[#9CF0FF]/10 transition-colors disabled:opacity-40"
                style={{ border: "1px solid rgba(156,240,255,0.20)" }}
              >
                {q}
              </button>
            ))}
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
              {/* Show more — random unseen page. Hidden when we've
                  exhausted the result space (totalPages == seenPages). */}
              {moreAvailable && (
                <div className="flex justify-center mt-5">
                  <button
                    onClick={showMore}
                    disabled={loadingMore}
                    className="px-5 py-2 rounded-full text-xs font-bold font-headline text-[#9CF0FF] hover:text-white hover:bg-[#9CF0FF]/10 transition-colors disabled:opacity-50"
                    style={{ border: "1px solid rgba(156,240,255,0.30)" }}
                  >
                    {loadingMore ? "Loading…" : "Show more"}
                  </button>
                </div>
              )}
              <p className="text-center text-[10px] text-[#9CF0FF]/30 mt-4">
                {photos.length} photo{photos.length === 1 ? "" : "s"}
                {totalPages > 0 && ` · ${seenPages.size}/${totalPages} pages loaded`} ·
                Photos by{" "}
                <a href="https://unsplash.com" target="_blank" rel="noopener noreferrer" className="underline">Unsplash</a>
              </p>
            </>
          )}

          {!loading && !searched && (
            <div className="text-center py-16">
              <p className="text-sm text-[#9CF0FF]/50 mb-2">Search for free professional photos</p>
              <p className="text-xs text-[#9CF0FF]/30">Type a query above or tap a quick-pick keyword.</p>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
