/**
 * Shrinks a picked photo in the browser before upload (9 Sep 2026): the
 * long side to 1200px, JPEG at 0.86. A phone photo of several megabytes
 * becomes a few hundred kilobytes, so uploads are quick and there is no
 * size limit for the person to hit. Decoding goes through an <img>, which
 * every current browser orients by EXIF. Throws when the file is not an
 * image the browser can read (the caller shows a gentle message).
 */
export async function shrinkPhoto(file: File, maxSide = 1200): Promise<File> {
  const url = URL.createObjectURL(file);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const i = new Image();
      i.onload = () => resolve(i);
      i.onerror = () => reject(new Error("unreadable"));
      i.src = url;
    });
    const w = img.naturalWidth;
    const h = img.naturalHeight;
    if (!w || !h) throw new Error("unreadable");
    const scale = Math.min(1, maxSide / Math.max(w, h));
    const cw = Math.round(w * scale);
    const ch = Math.round(h * scale);
    const canvas = document.createElement("canvas");
    canvas.width = cw;
    canvas.height = ch;
    const ctx = canvas.getContext("2d");
    if (!ctx) throw new Error("unreadable");
    ctx.drawImage(img, 0, 0, cw, ch);
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.86));
    if (!blob) throw new Error("unreadable");
    return new File([blob], "photo.jpg", { type: "image/jpeg" });
  } finally {
    URL.revokeObjectURL(url);
  }
}
