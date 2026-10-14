/**
 * Downscales a full-size capture to a JPEG thumbnail so the gallery and
 * the replay timeline don't store every PNG at full weight in IndexedDB.
 * Falls back to the original data URL when canvas is unavailable
 * (jsdom tests, headless contexts).
 */
export async function makeThumbnail(dataUrl: string, maxDim = 200): Promise<string> {
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const el = new Image();
      el.onload = () => resolve(el);
      el.onerror = reject;
      el.src = dataUrl;
    });
    const scale = Math.min(1, maxDim / Math.max(img.naturalWidth, img.naturalHeight));
    const w = Math.max(1, Math.round(img.naturalWidth * scale));
    const h = Math.max(1, Math.round(img.naturalHeight * scale));
    const canvas = document.createElement('canvas');
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext('2d');
    if (!ctx) return dataUrl;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(0, 0, w, h);
    ctx.drawImage(img, 0, 0, w, h);
    return canvas.toDataURL('image/jpeg', 0.72);
  } catch {
    return dataUrl;
  }
}
