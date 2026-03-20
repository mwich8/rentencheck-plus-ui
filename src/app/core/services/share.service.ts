import { Injectable } from '@angular/core';

/**
 * Service for sharing content via the Web Share API
 * with clipboard and download fallbacks.
 */
@Injectable({ providedIn: 'root' })
export class ShareService {

  /** Whether the browser supports sharing files via Web Share API. */
  canShareFiles(): boolean {
    return typeof navigator !== 'undefined'
      && 'share' in navigator
      && 'canShare' in navigator;
  }

  /**
   * Share an image blob via Web Share API.
   * Falls back to clipboard copy, then download.
   */
  async shareImage(blob: Blob, title: string, text: string): Promise<'shared' | 'clipboard' | 'download'> {
    const file = new File([blob], 'renten-score.png', { type: 'image/png' });

    // Try Web Share API with file
    if (this.canShareFiles()) {
      try {
        const shareData: ShareData = { title, text, files: [file] };
        if (navigator.canShare(shareData)) {
          await navigator.share(shareData);
          return 'shared';
        }
      } catch (err) {
        // User cancelled or API failed — fall through to clipboard
        if ((err as DOMException)?.name === 'AbortError') {
          return 'shared'; // User intentionally cancelled
        }
      }
    }

    // Try clipboard
    if (typeof navigator !== 'undefined' && navigator.clipboard && 'write' in navigator.clipboard) {
      try {
        await navigator.clipboard.write([
          new ClipboardItem({ 'image/png': blob }),
        ]);
        return 'clipboard';
      } catch {
        // Clipboard failed — fall through to download
      }
    }

    // Fallback: download
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'renten-score.png';
    a.click();
    URL.revokeObjectURL(url);
    return 'download';
  }

  /**
   * Share a URL with text via Web Share API.
   * Falls back to clipboard copy.
   */
  async shareUrl(url: string, title: string, text: string): Promise<'shared' | 'clipboard'> {
    if (typeof navigator !== 'undefined' && 'share' in navigator) {
      try {
        await navigator.share({ title, text, url });
        return 'shared';
      } catch {
        // Fall through
      }
    }

    // Clipboard fallback
    if (typeof navigator !== 'undefined' && navigator.clipboard) {
      await navigator.clipboard.writeText(`${text}\n${url}`);
    }
    return 'clipboard';
  }
}

