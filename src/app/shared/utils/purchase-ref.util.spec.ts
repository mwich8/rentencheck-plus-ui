import { shortPurchaseRef } from './purchase-ref.util';

describe('shortPurchaseRef', () => {
  it('should extract the first UUID segment and uppercase it', () => {
    expect(shortPurchaseRef('a1b2c3d4-e5f6-7890-abcd-ef1234567890')).toBe('RC-A1B2C3D4');
  });

  it('should handle already-uppercase input', () => {
    expect(shortPurchaseRef('DEADBEEF-1234-5678-9ABC-DEF012345678')).toBe('RC-DEADBEEF');
  });

  it('should handle a short non-UUID string gracefully', () => {
    expect(shortPurchaseRef('purchase-1')).toBe('RC-PURCHASE');
  });

  it('should handle a string without hyphens', () => {
    expect(shortPurchaseRef('abc123')).toBe('RC-ABC123');
  });

  it('should handle an empty string gracefully', () => {
    expect(shortPurchaseRef('')).toBe('RC-');
  });
});


