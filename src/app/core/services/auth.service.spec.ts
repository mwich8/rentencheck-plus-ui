import { TestBed } from '@angular/core/testing';
import { AuthService } from './auth.service';

const SESSION_KEY = 'rentencheck_session';

describe('AuthService', () => {
  let service: AuthService;

  beforeEach(() => {
    localStorage.removeItem(SESSION_KEY);
    TestBed.configureTestingModule({});
    service = TestBed.inject(AuthService);
  });

  afterEach(() => {
    localStorage.removeItem(SESSION_KEY);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });

  describe('initial state', () => {
    it('should not be logged in by default', () => {
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should have null user by default', () => {
      expect(service.currentUser()).toBeNull();
    });

    it('should have null email by default', () => {
      expect(service.userEmail()).toBeNull();
    });
  });

  describe('sendMagicLink', () => {
    it('should call the send-magic-link endpoint', async () => {
      const fetchSpy = spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ sent: true }), { status: 200 })
      );

      const result = await service.sendMagicLink('test@example.com');
      expect(result).toBeNull(); // null = success
      expect(fetchSpy).toHaveBeenCalledWith(
        '/.netlify/functions/send-magic-link',
        jasmine.objectContaining({ method: 'POST' })
      );
    });

    it('should return error message on failure', async () => {
      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({ error: 'Rate limited' }), { status: 429 })
      );

      const result = await service.sendMagicLink('test@example.com');
      expect(result).toBeTruthy();
    });

    it('should return network error message when fetch throws', async () => {
      spyOn(window, 'fetch').and.rejectWith(new Error('Network failure'));

      const result = await service.sendMagicLink('test@example.com');
      expect(result).toContain('Netzwerkfehler');
    });
  });

  describe('verifyToken', () => {
    it('should set currentUser and store session on success', async () => {
      const sessionToken = 'session.token123';
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({
          authenticated: true,
          email: 'user@example.com',
          sessionToken,
          expiresAt,
        }), { status: 200 })
      );

      const result = await service.verifyToken('magic-link-token-abc');
      expect(result).toBeNull(); // null = success
      expect(service.currentUser()).toBe('user@example.com');
      expect(service.isLoggedIn()).toBeTrue();
      expect(service.userEmail()).toBe('user@example.com');
    });

    it('should persist session to localStorage', async () => {
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({
          authenticated: true,
          email: 'user@example.com',
          sessionToken: 'tok.123',
          expiresAt,
        }), { status: 200 })
      );

      await service.verifyToken('token123');
      const stored = JSON.parse(localStorage.getItem(SESSION_KEY)!);
      expect(stored.email).toBe('user@example.com');
      expect(stored.token).toBe('tok.123');
    });

    it('should return error when server says not authenticated', async () => {
      spyOn(window, 'fetch').and.callFake(async () =>
        new Response(JSON.stringify({
          authenticated: false,
          error: 'Dieser Link ist abgelaufen.',
        }), { status: 400 })
      );

      const result = await service.verifyToken('expired-token');
      expect(result).toContain('abgelaufen');
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should return error when fetch throws', async () => {
      spyOn(window, 'fetch').and.rejectWith(new Error('fail'));

      const result = await service.verifyToken('some-token');
      expect(result).toBeTruthy();
      expect(service.isLoggedIn()).toBeFalse();
    });
  });

  describe('getSessionToken', () => {
    it('should return null when not logged in', () => {
      expect(service.getSessionToken()).toBeNull();
    });

    it('should return the token when a valid session is stored', () => {
      const session = {
        email: 'user@example.com',
        token: 'my-session-token',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      expect(service.getSessionToken()).toBe('my-session-token');
    });

    it('should return null and sign out when session is expired', () => {
      const session = {
        email: 'user@example.com',
        token: 'expired-token',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      expect(service.getSessionToken()).toBeNull();
      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    });
  });

  describe('signOut', () => {
    it('should set currentUser to null after sign out', async () => {
      await service.signOut();
      expect(service.currentUser()).toBeNull();
      expect(service.isLoggedIn()).toBeFalse();
    });

    it('should clear localStorage', async () => {
      localStorage.setItem(SESSION_KEY, JSON.stringify({ email: 'x', token: 'y', expiresAt: 'z' }));
      await service.signOut();
      expect(localStorage.getItem(SESSION_KEY)).toBeNull();
    });
  });

  describe('session restoration on construction', () => {
    it('should restore logged-in state from a valid stored session', () => {
      const session = {
        email: 'restored@example.com',
        token: 'tok',
        expiresAt: new Date(Date.now() + 60_000).toISOString(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      // Create a new service instance to test constructor restoration
      const freshService = new AuthService();
      expect(freshService.currentUser()).toBe('restored@example.com');
      expect(freshService.isLoggedIn()).toBeTrue();
    });

    it('should not restore from an expired stored session', () => {
      const session = {
        email: 'old@example.com',
        token: 'tok',
        expiresAt: new Date(Date.now() - 1000).toISOString(),
      };
      localStorage.setItem(SESSION_KEY, JSON.stringify(session));

      const freshService = new AuthService();
      expect(freshService.currentUser()).toBeNull();
      expect(freshService.isLoggedIn()).toBeFalse();
    });
  });
});

