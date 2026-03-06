import { TestBed } from '@angular/core/testing';
import { PremiumUnlockService } from './premium-unlock.service';

describe('PremiumUnlockService', () => {
  let service: PremiumUnlockService;

  beforeEach(() => {
    // Clear localStorage before each test
    localStorage.removeItem('rentencheck_premium_unlocked');
    TestBed.configureTestingModule({});
    service = TestBed.inject(PremiumUnlockService);
  });

  afterEach(() => {
    localStorage.removeItem('rentencheck_premium_unlocked');
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should be locked by default', () => {
      expect(service.isUnlocked()).toBeFalse();
    });
  });

  describe('unlock', () => {
    it('should set isUnlocked to true', () => {
      service.unlock();
      expect(service.isUnlocked()).toBeTrue();
    });

    it('should persist to localStorage', () => {
      service.unlock();
      expect(localStorage.getItem('rentencheck_premium_unlocked')).toBe('true');
    });
  });

  describe('lock', () => {
    it('should set isUnlocked to false', () => {
      service.unlock();
      expect(service.isUnlocked()).toBeTrue();
      service.lock();
      expect(service.isUnlocked()).toBeFalse();
    });

    it('should remove from localStorage', () => {
      service.unlock();
      service.lock();
      expect(localStorage.getItem('rentencheck_premium_unlocked')).toBeNull();
    });
  });

  describe('persistence across service instances', () => {
    it('should read unlocked state from localStorage on construction', () => {
      localStorage.setItem('rentencheck_premium_unlocked', 'true');
      // Create a new service instance
      const newService = new PremiumUnlockService();
      expect(newService.isUnlocked()).toBeTrue();
    });

    it('should read locked state from localStorage on construction', () => {
      localStorage.removeItem('rentencheck_premium_unlocked');
      const newService = new PremiumUnlockService();
      expect(newService.isUnlocked()).toBeFalse();
    });
  });
});

