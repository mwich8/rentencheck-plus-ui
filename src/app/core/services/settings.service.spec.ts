import { TestBed } from '@angular/core/testing';
import { SettingsService } from './settings.service';
import { AuthService } from './auth.service';
import { DEFAULT_PENSION_INPUT, PensionInput } from '@core/models/pension-input.model';

describe('SettingsService', () => {
  let service: SettingsService;
  let authServiceSpy: jasmine.SpyObj<AuthService>;

  beforeEach(() => {
    authServiceSpy = jasmine.createSpyObj('AuthService', ['getSessionToken']);

    TestBed.configureTestingModule({
      providers: [
        SettingsService,
        { provide: AuthService, useValue: authServiceSpy },
      ],
    });
    service = TestBed.inject(SettingsService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should initialize with null cloudSettings', () => {
    expect(service.cloudSettings()).toBeNull();
  });

  it('should initialize with loading = false', () => {
    expect(service.loading()).toBeFalse();
  });

  it('should return false from saveSettings when not logged in', async () => {
    authServiceSpy.getSessionToken.and.returnValue(null);
    const result = await service.saveSettings(DEFAULT_PENSION_INPUT);
    expect(result).toBeFalse();
    expect(service.error()).toBe('Nicht angemeldet.');
  });

  it('should return null from loadSettings when not logged in', async () => {
    authServiceSpy.getSessionToken.and.returnValue(null);
    const result = await service.loadSettings();
    expect(result).toBeNull();
  });

  it('should call save-settings endpoint when logged in', async () => {
    authServiceSpy.getSessionToken.and.returnValue('valid-token');
    const mockSettings: PensionInput = { ...DEFAULT_PENSION_INPUT, bruttoMonatlicheRente: 2000 };

    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.resolve(new Response(JSON.stringify({ saved: true }), { status: 200 }))
    );

    const result = await service.saveSettings(mockSettings);
    expect(result).toBeTrue();
    expect(service.cloudSettings()).toEqual(mockSettings);
    expect(service.saveSuccess()).toBeTrue();
    expect(globalThis.fetch).toHaveBeenCalledWith(
      '/.netlify/functions/save-settings',
      jasmine.objectContaining({
        method: 'POST',
        body: jasmine.stringContaining('"bruttoMonatlicheRente":2000'),
      })
    );
  });

  it('should handle save-settings error response', async () => {
    authServiceSpy.getSessionToken.and.returnValue('valid-token');

    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.resolve(new Response(JSON.stringify({ error: 'Failed' }), { status: 500 }))
    );

    const result = await service.saveSettings(DEFAULT_PENSION_INPUT);
    expect(result).toBeFalse();
    expect(service.error()).toBeTruthy();
  });

  it('should call get-settings endpoint and return settings', async () => {
    authServiceSpy.getSessionToken.and.returnValue('valid-token');
    const mockSettings: PensionInput = { ...DEFAULT_PENSION_INPUT, aktuellesAlter: 42 };

    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.resolve(new Response(JSON.stringify({ settings: mockSettings }), { status: 200 }))
    );

    const result = await service.loadSettings();
    expect(result).toBeTruthy();
    expect(result!.aktuellesAlter).toBe(42);
    expect(service.cloudSettings()).toBeTruthy();
  });

  it('should return null when no settings are saved', async () => {
    authServiceSpy.getSessionToken.and.returnValue('valid-token');

    spyOn(globalThis, 'fetch').and.returnValue(
      Promise.resolve(new Response(JSON.stringify({ settings: null }), { status: 200 }))
    );

    const result = await service.loadSettings();
    expect(result).toBeNull();
    expect(service.cloudSettings()).toBeNull();
  });

  it('should handle network errors gracefully on save', async () => {
    authServiceSpy.getSessionToken.and.returnValue('valid-token');
    spyOn(globalThis, 'fetch').and.returnValue(Promise.reject(new Error('Network error')));

    const result = await service.saveSettings(DEFAULT_PENSION_INPUT);
    expect(result).toBeFalse();
    expect(service.error()).toBeTruthy();
  });

  it('should handle network errors gracefully on load', async () => {
    authServiceSpy.getSessionToken.and.returnValue('valid-token');
    spyOn(globalThis, 'fetch').and.returnValue(Promise.reject(new Error('Network error')));

    const result = await service.loadSettings();
    expect(result).toBeNull();
    expect(service.error()).toBeTruthy();
  });
});

