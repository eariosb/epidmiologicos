/**
 * Copies text to the clipboard, falling back to a hidden textarea +
 * execCommand when the async Clipboard API is unavailable, e.g. on
 * insecure origins (LAN IPs) where navigator.clipboard is undefined.
 * Never throws: returns false when nothing could be copied.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
    const el = document.createElement('textarea');
    el.value = text;
    el.style.position = 'fixed';
    el.style.opacity = '0';
    document.body.appendChild(el);
    el.select();
    document.execCommand('copy');
    el.remove();
    return true;
  } catch {
    return false;
  }
}
