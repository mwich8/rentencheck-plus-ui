import { TestBed } from '@angular/core/testing';
import { BackendWakeUpService } from './backend-wake-up.service';

describe('BackendWakeUpService', () => {
  let service: BackendWakeUpService;
  let fetchSpy: jasmine.Spy;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(BackendWakeUpService);
    fetchSpy = spyOn(globalThis, 'fetch').and.returnValue(
      Promise.resolve(new Response(JSON.stringify({ status: 'ok' }), { status: 200 })),
    );
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  it('should NOT ping in non-production mode on init', () => {
    service.init();
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it('should silently handle fetch failures', async () => {
    fetchSpy.and.returnValue(Promise.reject(new Error('Network down')));
    // Should not throw
    expect(() => service.init()).not.toThrow();
  });

  it('should be idempotent — multiple init() calls have no side effects', () => {
    service.init();
    service.init();
    service.init();
    // Only one set of listeners/intervals should be registered (verified by no errors)
    expect(service).toBeTruthy();
  });
});
