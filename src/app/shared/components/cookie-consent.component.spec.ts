import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { CookieConsentComponent } from './cookie-consent.component';
import { AnalyticsService } from '@core/services/analytics.service';

describe('CookieConsentComponent', () => {
  let component: CookieConsentComponent;
  let fixture: ComponentFixture<CookieConsentComponent>;
  let analyticsSpy: jasmine.SpyObj<AnalyticsService>;

  const CONSENT_KEY = 'rentencheck_cookie_consent';

  beforeEach(async () => {
    analyticsSpy = jasmine.createSpyObj('AnalyticsService', ['init']);

    // Clear localStorage before each test
    localStorage.removeItem(CONSENT_KEY);

    await TestBed.configureTestingModule({
      imports: [CookieConsentComponent],
      providers: [
        provideRouter([]),
        { provide: AnalyticsService, useValue: analyticsSpy },
      ],
    }).compileComponents();

    fixture = TestBed.createComponent(CookieConsentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  afterEach(() => {
    localStorage.removeItem(CONSENT_KEY);
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });

  describe('Initial state', () => {
    it('should be visible when no consent is stored', () => {
      expect(component.visible()).toBeTrue();
    });

    it('should not be visible when consent is already stored', () => {
      localStorage.setItem(CONSENT_KEY, JSON.stringify({ level: 'all', timestamp: new Date().toISOString() }));

      // Re-create component after setting storage
      fixture = TestBed.createComponent(CookieConsentComponent);
      component = fixture.componentInstance;
      fixture.detectChanges();

      expect(component.visible()).toBeFalse();
    });
  });

  describe('accept()', () => {
    it('should hide the banner when accepting all', () => {
      component.accept('all');
      expect(component.visible()).toBeFalse();
    });

    it('should hide the banner when accepting necessary only', () => {
      component.accept('necessary');
      expect(component.visible()).toBeFalse();
    });

    it('should store consent in localStorage', () => {
      component.accept('all');
      const stored = JSON.parse(localStorage.getItem(CONSENT_KEY)!);
      expect(stored.level).toBe('all');
      expect(stored.timestamp).toBeTruthy();
    });

    it('should initialize analytics when accepting all', () => {
      component.accept('all');
      expect(analyticsSpy.init).toHaveBeenCalled();
    });

    it('should NOT initialize analytics when accepting necessary only', () => {
      component.accept('necessary');
      expect(analyticsSpy.init).not.toHaveBeenCalled();
    });
  });

  describe('Template rendering', () => {
    it('should render the consent banner when visible', () => {
      const el: HTMLElement = fixture.nativeElement;
      const banner = el.querySelector('.consent-banner');
      expect(banner).toBeTruthy();
    });

    it('should have role="dialog" for accessibility', () => {
      const el: HTMLElement = fixture.nativeElement;
      const dialog = el.querySelector('[role="dialog"]');
      expect(dialog).toBeTruthy();
    });

    it('should render both accept buttons', () => {
      const el: HTMLElement = fixture.nativeElement;
      const buttons = el.querySelectorAll('button');
      expect(buttons.length).toBe(2);
      expect(buttons[0].textContent).toContain('Alle akzeptieren');
      expect(buttons[1].textContent).toContain('Nur notwendige');
    });
  });

  describe('localStorage resilience', () => {
    it('should not throw when localStorage throws on setItem', () => {
      spyOn(localStorage, 'setItem').and.throwError('QuotaExceededError');
      expect(() => component.accept('all')).not.toThrow();
      expect(component.visible()).toBeFalse();
    });

    it('should not throw when localStorage throws on getItem', () => {
      spyOn(localStorage, 'getItem').and.throwError('SecurityError');
      // Re-create component - should handle the error gracefully
      expect(() => {
        fixture = TestBed.createComponent(CookieConsentComponent);
        component = fixture.componentInstance;
        fixture.detectChanges();
      }).not.toThrow();
    });
  });
});

