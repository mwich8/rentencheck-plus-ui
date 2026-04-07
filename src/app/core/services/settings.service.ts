import { Injectable, inject, signal } from '@angular/core';
import { AuthService } from './auth.service';
import { PensionInput } from '@core/models/pension-input.model';
import { PensionInputValidator } from '@core/models/pension-input-validator';

/**
 * Service to save and load calculator settings from the cloud.
 *
 * - Authenticated users can persist their PensionInput to the `users.settings` column.
 * - On login, settings are loaded automatically and can be applied to the calculator.
 * - Anonymous users are unaffected — the calculator works fully client-side.
 *
 * API endpoints:
 *   POST /.netlify/functions/save-settings { sessionToken, settings }
 *   POST /.netlify/functions/get-settings  { sessionToken }
 */
@Injectable({ providedIn: 'root' })
export class SettingsService {
  private readonly auth = inject(AuthService);

  /** Last loaded cloud settings (null = not loaded or no settings saved) */
  readonly cloudSettings = signal<PensionInput | null>(null);

  /** Loading state for settings operations */
  readonly loading = signal<boolean>(false);

  /** Error message from last operation */
  readonly error = signal<string | null>(null);

  /** Save feedback */
  readonly saveSuccess = signal<boolean>(false);

  /** Guard: prevent concurrent save/load calls */
  private saveInFlight = false;
  private loadInFlight = false;

  /**
   * Save the current calculator settings to the cloud.
   * Requires an authenticated session.
   */
  async saveSettings(settings: PensionInput): Promise<boolean> {
    if (this.saveInFlight) return false;

    const sessionToken = this.auth.getSessionToken();
    if (!sessionToken) {
      this.error.set('Nicht angemeldet.');
      return false;
    }

    this.saveInFlight = true;
    this.loading.set(true);
    this.error.set(null);
    this.saveSuccess.set(false);

    try {
      const response = await fetch('/.netlify/functions/save-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken, settings }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        console.error('[SettingsService] Save error:', result.error);
        this.error.set('Einstellungen konnten nicht gespeichert werden.');
        return false;
      }

      this.cloudSettings.set(settings);
      this.saveSuccess.set(true);

      // Auto-clear success indicator after 3 seconds
      setTimeout(() => this.saveSuccess.set(false), 3000);

      return true;
    } catch (err) {
      console.error('[SettingsService] Unexpected save error:', err);
      this.error.set('Ein unerwarteter Fehler ist aufgetreten.');
      return false;
    } finally {
      this.loading.set(false);
      this.saveInFlight = false;
    }
  }

  /**
   * Load the user's saved settings from the cloud.
   * Returns the settings if found, or null if none are saved.
   * Requires an authenticated session.
   */
  async loadSettings(): Promise<PensionInput | null> {
    if (this.loadInFlight) return this.cloudSettings();

    const sessionToken = this.auth.getSessionToken();
    if (!sessionToken) {
      return null;
    }

    this.loadInFlight = true;
    this.loading.set(true);
    this.error.set(null);

    try {
      const response = await fetch('/.netlify/functions/get-settings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionToken }),
      });

      const result = await response.json();

      if (!response.ok || result.error) {
        console.error('[SettingsService] Load error:', result.error);
        this.error.set('Einstellungen konnten nicht geladen werden.');
        return null;
      }

      if (result.settings) {
        // Sanitize the loaded settings through the validator
        const sanitized = PensionInputValidator.sanitize(result.settings as PensionInput);
        this.cloudSettings.set(sanitized);
        return sanitized;
      }

      this.cloudSettings.set(null);
      return null;
    } catch (err) {
      console.error('[SettingsService] Unexpected load error:', err);
      this.error.set('Ein unerwarteter Fehler ist aufgetreten.');
      return null;
    } finally {
      this.loading.set(false);
      this.loadInFlight = false;
    }
  }
}

