/**
 * @jest-environment jsdom
 */
import { getStripe, createCheckoutSession } from '@/lib/stripe';

// Mock @stripe/stripe-js
jest.mock('@stripe/stripe-js', () => ({
  loadStripe: jest.fn().mockResolvedValue({
    elements: jest.fn(),
    createToken: jest.fn(),
  }),
}));

describe('Stripe Utilities', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
    // Reset the module cache to reset stripePromise
    jest.resetModules();
  });

  afterEach(() => {
    process.env = originalEnv;
    jest.clearAllMocks();
  });

  describe('getStripe', () => {
    it('should return null if key is not set', async () => {
      // Clear the key
      delete process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY;

      // Re-import to reset module state
      const { getStripe: freshGetStripe } = await import('@/lib/stripe');

      const consoleSpy = jest.spyOn(console, 'warn').mockImplementation();
      const result = await freshGetStripe();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalledWith('Stripe publishable key not set');
      consoleSpy.mockRestore();
    });

    it('should call loadStripe with the publishable key', async () => {
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_123';

      // Re-import to get fresh module
      const { getStripe: freshGetStripe } = await import('@/lib/stripe');
      const { loadStripe } = await import('@stripe/stripe-js');

      await freshGetStripe();

      expect(loadStripe).toHaveBeenCalledWith('pk_test_123');
    });

    it('should cache the stripe promise', async () => {
      process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY = 'pk_test_456';

      // Re-import to get fresh module
      const { getStripe: freshGetStripe } = await import('@/lib/stripe');
      const { loadStripe } = await import('@stripe/stripe-js');

      // Call twice
      await freshGetStripe();
      await freshGetStripe();

      // Should only load once
      expect(loadStripe).toHaveBeenCalledTimes(1);
    });
  });

  describe('createCheckoutSession', () => {
    beforeEach(() => {
      global.fetch = jest.fn();
    });

    afterEach(() => {
      jest.restoreAllMocks();
    });

    it('should call the checkout API', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () =>
          Promise.resolve({ url: 'https://checkout.stripe.com/test' }),
      });

      const result = await createCheckoutSession();

      expect(global.fetch).toHaveBeenCalledWith('/api/create-checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ priceAmount: 499 }),
      });
      expect(result).toEqual({ url: 'https://checkout.stripe.com/test' });
    });

    it('should return null on API error', async () => {
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: false,
        status: 500,
      });

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await createCheckoutSession();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should return null on network error', async () => {
      (global.fetch as jest.Mock).mockRejectedValue(new Error('Network error'));

      const consoleSpy = jest.spyOn(console, 'error').mockImplementation();
      const result = await createCheckoutSession();

      expect(result).toBeNull();
      expect(consoleSpy).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should handle successful response with URL', async () => {
      const checkoutUrl = 'https://checkout.stripe.com/pay/cs_test_123';
      (global.fetch as jest.Mock).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ url: checkoutUrl }),
      });

      const result = await createCheckoutSession();

      expect(result).toEqual({ url: checkoutUrl });
    });
  });
});
