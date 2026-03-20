import { TestBed } from '@angular/core/testing';
import { PremiumUnlockService } from './premium-unlock.service';

const STORAGE_KEY = 'rentencheck_download_token';
const FAKE_TOKEN = '550e8400-e29b-41d4-a716-446655440000';

describe('PremiumUnlockService', () => {
  let service: PremiumUnlockService;

  beforeEach(() => {
    localStorage.removeItem(STORAGE_KEY);
    TestBed.configureTestingModule({});
    service = TestBed.inject(PremiumUnlockService);
  });

  afterEach(() => {
    localStorage.removeItem(STORAGE_KEY);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should be locked by default', () => {
      expect(service.isUnlocked()).toBeFalse();
    });

    it('should have no token by default', () => {
      expect(service.getToken()).toBeNull();
    });
  });

  describe('unlock', () => {
    it('should set isUnlocked to true', () => {
      service.unlock(FAKE_TOKEN);
      expect(service.isUnlocked()).toBeTrue();
    });

    it('should persist the token to localStorage', () => {
      service.unlock(FAKE_TOKEN);
      expect(localStorage.getItem(STORAGE_KEY)).toBe(FAKE_TOKEN);
    });

    it('should make the token retrievable via getToken()', () => {
      service.unlock(FAKE_TOKEN);
      expect(service.getToken()).toBe(FAKE_TOKEN);
    });
  });

  describe('lock', () => {
    it('should set isUnlocked to false', () => {
      service.unlock(FAKE_TOKEN);
      expect(service.isUnlocked()).toBeTrue();
      service.lock();
      expect(service.isUnlocked()).toBeFalse();
    });

    it('should remove the token from localStorage', () => {
      service.unlock(FAKE_TOKEN);
      service.lock();
      expect(localStorage.getItem(STORAGE_KEY)).toBeNull();
      expect(service.getToken()).toBeNull();
    });
  });

  describe('persistence across service instances', () => {
    it('should read unlocked state from localStorage on construction', () => {
      localStorage.setItem(STORAGE_KEY, FAKE_TOKEN);
      const newService = new PremiumUnlockService();
      expect(newService.isUnlocked()).toBeTrue();
      expect(newService.getToken()).toBe(FAKE_TOKEN);
    });

    it('should read locked state from localStorage on construction', () => {
      localStorage.removeItem(STORAGE_KEY);
      const newService = new PremiumUnlockService();
      expect(newService.isUnlocked()).toBeFalse();
    });
  });

  describe('verifyToken', () => {
    it('should return invalid if no token is stored', async () => {
      const result = await service.verifyToken();
      expect(result.valid).toBeFalse();
      expect(result.reason).toContain('No token');
    });

    it('should call verify-download endpoint with the stored token', async () => {
      service.unlock(FAKE_TOKEN);

      const fetchSpy = spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ valid: true, tier: 'report' }), { status: 200 })
      );

      const result = await service.verifyToken();
      expect(result.valid).toBeTrue();
      expect(fetchSpy).toHaveBeenCalledWith('/.netlify/functions/verify-download', jasmine.objectContaining({
        method: 'POST',
        body: JSON.stringify({ downloadToken: FAKE_TOKEN }),
      }));
    });

    it('should lock the service if the server says token is invalid', async () => {
      service.unlock(FAKE_TOKEN);

      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ valid: false, reason: 'Refunded' }), { status: 200 })
      );

      const result = await service.verifyToken();
      expect(result.valid).toBeFalse();
      expect(service.isUnlocked()).toBeFalse();
      expect(service.getToken()).toBeNull();
    });

    it('should handle network errors gracefully', async () => {
      service.unlock(FAKE_TOKEN);

      spyOn(window, 'fetch').and.rejectWith(new Error('Network error'));

      const result = await service.verifyToken();
      expect(result.valid).toBeFalse();
      expect(result.reason).toContain('Network error');
    });
  });
});
