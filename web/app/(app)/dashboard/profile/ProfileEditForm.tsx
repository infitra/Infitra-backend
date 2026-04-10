"use client";

import { useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function ProfileEditForm({
  displayName,
  tagline,
  bio,
  avatarUrl,
  coverUrl,
}: {
  displayName: string;
  tagline: string;
  bio: string;
  avatarUrl: string | null;
  coverUrl: string | null;
}) {
  const [avatarPreview, setAvatarPreview] = useState<string | null>(avatarUrl);
  const [coverPreview, setCoverPreview] = useState<string | null>(coverUrl);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);
  const avatarInputRef = useRef<HTMLInputElement>(null);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const avatarFileRef = useRef<File | null>(null);
  const coverFileRef = useRef<File | null>(null);

  function handleAvatarChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Avatar must be under 5MB.");
        return;
      }
      avatarFileRef.current = file;
      setAvatarPreview(URL.createObjectURL(file));
      setError(null);
    }
  }

  function handleCoverChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        setError("Cover image must be under 5MB.");
        return;
      }
      coverFileRef.current = file;
      setCoverPreview(URL.createObjectURL(file));
      setError(null);
    }
  }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(false);

    try {
      const supabase = createClient();
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("Not authenticated.");
        setSaving(false);
        return;
      }

      const form = e.currentTarget;
      const display_name = (
        form.elements.namedItem("display_name") as HTMLInputElement
      ).value.trim();
      const taglineVal =
        (form.elements.namedItem("tagline") as HTMLInputElement).value.trim() ||
        null;
      const bioVal =
        (form.elements.namedItem("bio") as HTMLTextAreaElement).value.trim() ||
        null;

      if (!display_name || display_name.length < 2) {
        setError("Display name must be at least 2 characters.");
        setSaving(false);
        return;
      }

      const updates: Record<string, any> = {
        display_name,
        tagline: taglineVal,
        bio: bioVal,
      };

      // Upload avatar directly from client
      if (avatarFileRef.current) {
        const file = avatarFileRef.current;
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/avatar.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("profile-images")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) {
          setError(`Avatar upload failed: ${upErr.message}`);
          setSaving(false);
          return;
        }
        const { data: urlData } = supabase.storage
          .from("profile-images")
          .getPublicUrl(path);
        updates.avatar_url = urlData.publicUrl;
      }

      // Upload cover directly from client
      if (coverFileRef.current) {
        const file = coverFileRef.current;
        const ext = file.name.split(".").pop()?.toLowerCase() || "jpg";
        const path = `${user.id}/cover.${ext}`;
        const { error: upErr } = await supabase.storage
          .from("profile-images")
          .upload(path, file, { upsert: true, contentType: file.type });
        if (upErr) {
          setError(`Cover upload failed: ${upErr.message}`);
          setSaving(false);
          return;
        }
        const { data: urlData } = supabase.storage
          .from("profile-images")
          .getPublicUrl(path);
        updates.cover_image_url = urlData.publicUrl;
      }

      // Update profile
      const { error: updateError } = await supabase
        .from("app_profile")
        .update(updates)
        .eq("id", user.id);

      if (updateError) {
        setError(updateError.message);
        setSaving(false);
        return;
      }

      setSuccess(true);
      avatarFileRef.current = null;
      coverFileRef.current = null;
    } catch (err: any) {
      setError(err?.message || "Something went wrong.");
    }
    setSaving(false);
  }

  const initials = (displayName || "?")[0].toUpperCase();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {error && (
        <div
          className="p-4 rounded-2xl"
          style={{
            backgroundColor: "rgba(255, 97, 48, 0.08)",
            border: "1px solid rgba(255, 97, 48, 0.25)",
          }}
        >
          <p className="text-sm text-[#FF6130]">{error}</p>
        </div>
      )}

      {success && (
        <div
          className="p-4 rounded-2xl"
          style={{
            backgroundColor: "rgba(16, 185, 129, 0.08)",
            border: "1px solid rgba(16, 185, 129, 0.25)",
          }}
        >
          <p className="text-sm text-emerald-700 font-bold font-headline">
            Profile updated!
          </p>
        </div>
      )}

      {/* Cover Image */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider font-headline text-[#94a3b8] mb-2">
          Cover Image
        </label>
        <button
          type="button"
          onClick={() => coverInputRef.current?.click()}
          className="w-full h-40 rounded-2xl overflow-hidden relative group"
          style={{
            backgroundColor: coverPreview ? undefined : "rgba(0, 0, 0, 0.04)",
            border: "1px dashed rgba(0, 0, 0, 0.12)",
          }}
        >
          {coverPreview ? (
            <img
              src={coverPreview}
              alt="Cover"
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-[#94a3b8]">
              <svg
                width="24"
                height="24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.5}
                viewBox="0 0 24 24"
              >
                <path
                  d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
              <span className="text-xs mt-2">Click to add a cover image</span>
            </div>
          )}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 flex items-center justify-center opacity-0 group-hover:opacity-100">
            <span className="text-xs font-bold text-white bg-black/50 px-3 py-1.5 rounded-full">
              Change
            </span>
          </div>
        </button>
        <input
          ref={coverInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleCoverChange}
        />
        <p className="text-[10px] text-[#94a3b8] mt-1">
          JPEG, PNG or WebP. Max 5MB. Recommended 1200×400.
        </p>
      </div>

      {/* Avatar */}
      <div>
        <label className="block text-xs font-bold uppercase tracking-wider font-headline text-[#94a3b8] mb-2">
          Profile Picture
        </label>
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => avatarInputRef.current?.click()}
            className="relative group"
          >
            {avatarPreview ? (
              <img
                src={avatarPreview}
                alt="Avatar"
                className="w-20 h-20 rounded-full object-cover"
                style={{ border: "2px solid rgba(255, 97, 48, 0.30)" }}
              />
            ) : (
              <div
                className="w-20 h-20 rounded-full flex items-center justify-center"
                style={{
                  backgroundColor: "rgba(255, 97, 48, 0.12)",
                  border: "2px solid rgba(255, 97, 48, 0.30)",
                }}
              >
                <span className="text-2xl font-black font-headline text-[#FF6130]">
                  {initials}
                </span>
              </div>
            )}
            <div className="absolute inset-0 rounded-full bg-black/0 group-hover:bg-black/20 flex items-center justify-center opacity-0 group-hover:opacity-100">
              <svg
                width="20"
                height="20"
                fill="none"
                stroke="white"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path
                  d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <circle cx="12" cy="13" r="4" />
              </svg>
            </div>
          </button>
          <div>
            <button
              type="button"
              onClick={() => avatarInputRef.current?.click()}
              className="text-xs font-bold font-headline text-[#FF6130]"
            >
              Upload photo
            </button>
            <p className="text-[10px] text-[#94a3b8] mt-0.5">
              Square image, max 5MB
            </p>
          </div>
        </div>
        <input
          ref={avatarInputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp"
          className="hidden"
          onChange={handleAvatarChange}
        />
      </div>

      {/* Display Name */}
      <div>
        <label
          htmlFor="display_name"
          className="block text-xs font-bold uppercase tracking-wider font-headline text-[#94a3b8] mb-2"
        >
          Display Name
        </label>
        <input
          id="display_name"
          name="display_name"
          type="text"
          required
          minLength={2}
          maxLength={50}
          defaultValue={displayName}
          className="w-full px-4 py-3 rounded-xl text-sm text-[#0F2229] focus:outline-none"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.78)",
            border: "1px solid rgba(0, 0, 0, 0.10)",
          }}
        />
      </div>

      {/* Tagline */}
      <div>
        <label
          htmlFor="tagline"
          className="block text-xs font-bold uppercase tracking-wider font-headline text-[#94a3b8] mb-2"
        >
          Tagline
          <span className="font-normal normal-case tracking-normal ml-2 text-[#94a3b8]">
            one line about you
          </span>
        </label>
        <input
          id="tagline"
          name="tagline"
          type="text"
          maxLength={120}
          defaultValue={tagline}
          placeholder="e.g. HIIT specialist · Community builder"
          className="w-full px-4 py-3 rounded-xl text-sm text-[#0F2229] focus:outline-none"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.78)",
            border: "1px solid rgba(0, 0, 0, 0.10)",
          }}
        />
      </div>

      {/* Bio */}
      <div>
        <label
          htmlFor="bio"
          className="block text-xs font-bold uppercase tracking-wider font-headline text-[#94a3b8] mb-2"
        >
          Bio
        </label>
        <textarea
          id="bio"
          name="bio"
          rows={4}
          maxLength={2000}
          defaultValue={bio}
          placeholder="Tell people about yourself, your experience, and what you offer..."
          className="w-full px-4 py-3 rounded-xl text-sm text-[#0F2229] resize-none focus:outline-none"
          style={{
            backgroundColor: "rgba(255, 255, 255, 0.78)",
            border: "1px solid rgba(0, 0, 0, 0.10)",
          }}
        />
      </div>

      {/* Submit */}
      <button
        type="submit"
        disabled={saving}
        className="w-full py-3.5 rounded-full text-white text-sm font-black font-headline disabled:opacity-50"
        style={{
          backgroundColor: "#FF6130",
          boxShadow: "0 4px 14px rgba(255,97,48,0.35)",
        }}
      >
        {saving ? "Saving..." : "Save Profile"}
      </button>
    </form>
  );
}
