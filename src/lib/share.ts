/**
 * Cross-platform sharing utility.
 *
 * - On Android (native): uses @capacitor/share to invoke the native share
 *   sheet, which includes WhatsApp when installed.
 * - On web: falls back to window.open with the WhatsApp share URL.
 */
import { Share } from '@capacitor/share';
import { isNativePlatform } from './platform';

/**
 * Share text content (optionally with a title). On native this opens the
 * OS share sheet; on web it opens WhatsApp's share URL in a new tab.
 */
export async function shareText(text: string, title?: string): Promise<boolean> {
  if (isNativePlatform()) {
    try {
      await Share.share({
        title: title || 'SIM KBM Ustaz',
        text,
        dialogTitle: title || 'Bagikan',
      });
      return true;
    } catch {
      // User cancelled or share failed — fall back to web method
    }
  }

  // Web fallback: open WhatsApp share URL
  try {
    if (typeof window !== 'undefined') {
      const url = `https://wa.me/?text=${encodeURIComponent(text)}`;
      window.open(url, '_blank', 'noopener,noreferrer');
      return true;
    }
  } catch {
    // ignore
  }
  return false;
}

/**
 * Share a URL with optional text.
 */
export async function shareUrl(url: string, text?: string): Promise<boolean> {
  const fullText = text ? `${text}\n${url}` : url;
  return shareText(fullText);
}

/**
 * Backward-compatible WhatsApp share. Existing code calls shareWA(text).
 */
export function shareWA(text: string): void {
  shareText(text);
}
