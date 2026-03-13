import { TestBed } from '@angular/core/testing';
import { AnalyticsService } from './analytics.service';

describe('AnalyticsService', () => {
  let service: AnalyticsService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AnalyticsService);
  });

  afterEach(() => {
    // Clean up injected script tags
    document.querySelectorAll('script[data-website-id]').forEach(el => el.remove());
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    delete (window as any).umami;
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('init', () => {
    it('should not inject script if websiteId is empty', () => {
      service.init();
      const scripts = document.querySelectorAll('script[data-website-id]');
      expect(scripts.length).toBe(0);
    });

    it('should not throw when calling init multiple times', () => {
      expect(() => {
        service.init();
        service.init();
      }).not.toThrow();
    });
  });

  describe('trackEvent', () => {
    it('should not throw when umami is not loaded', () => {
      expect(() => service.trackEvent('test_event')).not.toThrow();
    });

    it('should not throw with props', () => {
      expect(() => service.trackEvent('test_event', { key: 'value' })).not.toThrow();
    });
  });

  describe('convenience methods', () => {
    it('should call trackPdfDownload without error', () => {
      expect(() => service.trackPdfDownload()).not.toThrow();
    });

    it('should call trackAffiliateClick without error', () => {
      expect(() => service.trackAffiliateClick('banner')).not.toThrow();
    });

    it('should call trackCalculation without error', () => {
      expect(() => service.trackCalculation()).not.toThrow();
    });

    it('should call trackPremiumUnlock without error', () => {
      expect(() => service.trackPremiumUnlock()).not.toThrow();
    });
  });
});

