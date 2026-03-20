import { Injectable, signal, computed } from '@angular/core';

const SESSION_KEY = 'rentencheck_session';

interface StoredSession {
  email: string;
  token: string;
  expiresAt: string;
}

/**
 * Handles authentication via custom Magic Link flow (Netlify functions + Neon + Resend).
 *
 * Flow:
 * 1. User enters email → `sendMagicLink(email)` → calls send-magic-link function
 * 2. Email with link is sent via Resend
 * 3. User clicks link → redirected to /meine-kaeufe?token=xxx
 * 4. `verifyToken(token)` → calls verify-magic-link function → returns session
 * 5. Session stored in localStorage, `currentUser()` signal updates reactively
 *
 * Used for purchase recovery: user logs in → sees their purchases → can re-download PDFs.
 */
@Injectable({ providedIn: 'root' })
export class AuthService {
  /** Current authenticated email, or null if anonymous */
  readonly currentUser = signal<string | null>(this.restoreSession()?.email ?? null);

  /** Derived: whether a user is currently logged in */
  readonly isLoggedIn = computed(() => this.currentUser() !== null);

  /** Derived: email of the logged-in user */
  readonly userEmail = computed(() => this.currentUser());

  /**
   * Send a magic link to the given email via the backend.
   * @returns Error message string if failed, null if success
   */
  async sendMagicLink(email: string): Promise<string | null> {
    try {
      const response = await fetch('/.netlify/functions/send-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        return result.error || 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.';
      }

      return null; // Success
    } catch {
      return 'Netzwerkfehler. Bitte versuchen Sie es erneut.';
    }
  }

  /**
   * Verify a magic link token (from the URL query param after clicking the email link).
   * If valid, stores the session and updates the signal.
   * @returns Error message string if failed, null if success
   */
  async verifyToken(token: string): Promise<string | null> {
    try {
      const response = await fetch('/.netlify/functions/verify-magic-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token }),
      });

      const result = await response.json();

      if (!response.ok || !result.authenticated) {
        return result.error || 'Ungültiger oder abgelaufener Link.';
      }

      // Store session
      this.storeSession({
        email: result.email,
        token: result.sessionToken,
        expiresAt: result.expiresAt,
      });
      this.currentUser.set(result.email);

      return null; // Success
    } catch {
      return 'Anmeldung fehlgeschlagen. Bitte versuchen Sie es erneut.';
    }
  }

  /** Get the current session token (for authenticated API calls) */
  getSessionToken(): string | null {
    const session = this.restoreSession();
    if (!session) return null;

    // Check expiry
    if (new Date(session.expiresAt) < new Date()) {
      this.signOut();
      return null;
    }

    return session.token;
  }

  /** Sign out and clear the session */
  async signOut(): Promise<void> {
    try {
      localStorage.removeItem(SESSION_KEY);
    } catch { /* private browsing */ }
    this.currentUser.set(null);
  }

  private storeSession(session: StoredSession): void {
    try {
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));
    } catch { /* private browsing */ }
  }

  private restoreSession(): StoredSession | null {
    try {
      const raw = localStorage.getItem(SESSION_KEY);
      if (!raw) return null;
      const session: StoredSession = JSON.parse(raw);

      // Check expiry
      if (new Date(session.expiresAt) < new Date()) {
        localStorage.removeItem(SESSION_KEY);
        return null;
      }

      return session;
    } catch {
      return null;
    }
  }
}
