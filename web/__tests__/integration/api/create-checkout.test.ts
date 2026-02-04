/**
 * @jest-environment node
 */
import { NextRequest } from 'next/server';
import { POST } from '@/app/api/create-checkout/route';
import Stripe from 'stripe';

// Type for our mock instance
interface MockStripeInstance {
  checkout: {
    sessions: {
      create: jest.Mock;
    };
  };
}

// Mock Stripe
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        create: jest.fn(),
      },
    },
  }));
});

describe('Create Checkout API Route', () => {
  let mockStripeInstance: MockStripeInstance;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();

    // Save original environment
    originalEnv = process.env;

    // Mock Stripe instance
    mockStripeInstance = {
      checkout: {
        sessions: {
          create: jest.fn(),
        },
      },
    };

    (Stripe as jest.MockedClass<typeof Stripe>).mockImplementation(
      () => mockStripeInstance as unknown as Stripe
    );
  });

  afterEach(() => {
    // Restore original environment
    process.env = originalEnv;
  });

  describe('Environment Configuration', () => {
    it('should return error when STRIPE_SECRET_KEY is not set', async () => {
      delete process.env.STRIPE_SECRET_KEY;

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe(
        'Stripe is not configured. Set STRIPE_SECRET_KEY.'
      );
    });

    it('should initialize Stripe with correct API version', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';

      const mockSession = {
        id: 'cs_test_session',
        url: 'https://checkout.stripe.com/pay/cs_test_session',
      };

      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        mockSession as any
      );

      await POST();

      expect(Stripe).toHaveBeenCalledWith('sk_test_fake_key');
    });
  });

  describe('Checkout Session Creation', () => {
    beforeEach(() => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';
    });

    it('should create checkout session with correct parameters', async () => {
      const mockSession = {
        id: 'cs_test_session',
        url: 'https://checkout.stripe.com/pay/cs_test_session',
      };

      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        mockSession as any
      );

      const request = new NextRequest(
        'http://localhost:3000/api/create-checkout',
        {
          method: 'POST',
        }
      );

      const response = await POST();
      const data = await response.json();

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith({
        payment_method_types: ['card'],
        line_items: [
          {
            price_data: {
              currency: 'usd',
              product_data: {
                name: 'Passport Photo — Digital Download',
                description:
                  'High-resolution passport photo + 4×6 printable sheet. Compliant with government standards.',
              },
              unit_amount: 499,
            },
            quantity: 1,
          },
        ],
        mode: 'payment',
        success_url: `http://localhost:3000/app?paid=true&session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `http://localhost:3000/app?cancelled=true`,
      });

      expect(response.status).toBe(200);
      expect(data).toEqual({ url: mockSession.url });
    });

    it('should use custom base URL when NEXT_PUBLIC_BASE_URL is set', async () => {
      process.env.NEXT_PUBLIC_BASE_URL = 'https://example.com';

      const mockSession = {
        id: 'cs_test_session',
        url: 'https://checkout.stripe.com/pay/cs_test_session',
      };

      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        mockSession as any
      );

      const request = new NextRequest(
        'https://example.com/api/create-checkout',
        {
          method: 'POST',
        }
      );

      await POST();

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: `https://example.com/app?paid=true&session_id={CHECKOUT_SESSION_ID}`,
          cancel_url: `https://example.com/app?cancelled=true`,
        })
      );
    });

    it('should handle Stripe API errors', async () => {
      const stripeError = new Error('Your card was declined.');
      (stripeError as any).type = 'StripeCardError';

      mockStripeInstance.checkout.sessions.create.mockRejectedValue(
        stripeError
      );

      const request = new NextRequest(
        'http://localhost:3000/api/create-checkout',
        {
          method: 'POST',
        }
      );

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create checkout session');
    });

    it('should handle network timeouts', async () => {
      const timeoutError = new Error('Request timeout');
      (timeoutError as any).code = 'ETIMEDOUT';

      mockStripeInstance.checkout.sessions.create.mockRejectedValue(
        timeoutError
      );

      const request = new NextRequest(
        'http://localhost:3000/api/create-checkout',
        {
          method: 'POST',
        }
      );

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create checkout session');
    });

    it('should log errors for debugging', async () => {
      const consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation();
      const stripeError = new Error('API key invalid');

      mockStripeInstance.checkout.sessions.create.mockRejectedValue(
        stripeError
      );

      const request = new NextRequest(
        'http://localhost:3000/api/create-checkout',
        {
          method: 'POST',
        }
      );

      await POST();

      expect(consoleErrorSpy).toHaveBeenCalledWith(
        'Stripe checkout error:',
        stripeError
      );

      consoleErrorSpy.mockRestore();
    });
  });

  describe('Response Handling', () => {
    beforeEach(() => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';
    });

    it('should return session URL when successful', async () => {
      const mockSession = {
        id: 'cs_test_session',
        url: 'https://checkout.stripe.com/pay/cs_test_session',
      };

      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        mockSession as any
      );

      const request = new NextRequest(
        'http://localhost:3000/api/create-checkout',
        {
          method: 'POST',
        }
      );

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({
        url: 'https://checkout.stripe.com/pay/cs_test_session',
      });
    });

    it('should handle missing session URL', async () => {
      const mockSession = {
        id: 'cs_test_session',
        url: null, // Missing URL
      };

      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        mockSession as any
      );

      const request = new NextRequest(
        'http://localhost:3000/api/create-checkout',
        {
          method: 'POST',
        }
      );

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ url: null });
    });

    it('should have correct content type headers', async () => {
      const mockSession = {
        id: 'cs_test_session',
        url: 'https://checkout.stripe.com/pay/cs_test_session',
      };

      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        mockSession as any
      );

      const request = new NextRequest(
        'http://localhost:3000/api/create-checkout',
        {
          method: 'POST',
        }
      );

      const response = await POST();

      expect(response.headers.get('content-type')).toBe('application/json');
    });
  });

  describe('Edge Cases', () => {
    beforeEach(() => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';
    });

    it('should handle malformed Stripe responses', async () => {
      // Return malformed response (null)
      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        null as any
      );

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to create checkout session');
    });

    it('should handle very long environment variables', async () => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_' + 'x'.repeat(10000);
      process.env.NEXT_PUBLIC_BASE_URL = 'https://' + 'a'.repeat(1000) + '.com';

      const mockSession = {
        id: 'cs_test_session',
        url: 'https://checkout.stripe.com/pay/cs_test_session',
      };

      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        mockSession as any
      );

      const request = new NextRequest(
        'http://localhost:3000/api/create-checkout',
        {
          method: 'POST',
        }
      );

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ url: mockSession.url });
    });

    it('should handle concurrent requests', async () => {
      const mockSession = {
        id: 'cs_test_session',
        url: 'https://checkout.stripe.com/pay/cs_test_session',
      };

      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        mockSession as any
      );

      const request1 = new NextRequest(
        'http://localhost:3000/api/create-checkout',
        {
          method: 'POST',
        }
      );
      const request2 = new NextRequest(
        'http://localhost:3000/api/create-checkout',
        {
          method: 'POST',
        }
      );
      const request3 = new NextRequest(
        'http://localhost:3000/api/create-checkout',
        {
          method: 'POST',
        }
      );

      const responses = await Promise.all([POST(), POST(), POST()]);

      responses.forEach(async (response) => {
        expect(response.status).toBe(200);
        const data = await response.json();
        expect(data).toEqual({ url: mockSession.url });
      });

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledTimes(
        3
      );
    });

    it('should handle empty environment variables', async () => {
      process.env.STRIPE_SECRET_KEY = '';

      const request = new NextRequest(
        'http://localhost:3000/api/create-checkout',
        {
          method: 'POST',
        }
      );

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe(
        'Stripe is not configured. Set STRIPE_SECRET_KEY.'
      );
    });

    it('should handle special characters in environment variables', async () => {
      process.env.STRIPE_SECRET_KEY =
        'sk_test_key_with_special!@#$%^&*()_+{}|:"<>?[]\\;\'.,/';
      process.env.NEXT_PUBLIC_BASE_URL = 'https://test-app.example.com';

      const mockSession = {
        id: 'cs_test_session',
        url: 'https://checkout.stripe.com/pay/cs_test_session',
      };

      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        mockSession as any
      );

      const request = new NextRequest(
        'http://localhost:3000/api/create-checkout',
        {
          method: 'POST',
        }
      );

      const response = await POST();
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data).toEqual({ url: mockSession.url });
    });
  });

  describe('Business Logic Validation', () => {
    beforeEach(() => {
      process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';
    });

    it('should set correct product details', async () => {
      const mockSession = {
        id: 'cs_test_session',
        url: 'https://checkout.stripe.com/pay/cs_test_session',
      };

      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        mockSession as any
      );

      await POST();

      const expectedLineItems = [
        {
          price_data: {
            currency: 'usd',
            product_data: {
              name: 'Passport Photo — Digital Download',
              description:
                'High-resolution passport photo + 4×6 printable sheet. Compliant with government standards.',
            },
            unit_amount: 499, // $4.99
          },
          quantity: 1,
        },
      ];

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          line_items: expectedLineItems,
        })
      );
    });

    it('should set correct payment configuration', async () => {
      const mockSession = {
        id: 'cs_test_session',
        url: 'https://checkout.stripe.com/pay/cs_test_session',
      };

      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        mockSession as any
      );

      await POST();

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          payment_method_types: ['card'],
          mode: 'payment', // One-time payment, not subscription
        })
      );
    });

    it('should include session ID in success URL', async () => {
      const mockSession = {
        id: 'cs_test_session',
        url: 'https://checkout.stripe.com/pay/cs_test_session',
      };

      mockStripeInstance.checkout.sessions.create.mockResolvedValue(
        mockSession as any
      );

      await POST();

      expect(mockStripeInstance.checkout.sessions.create).toHaveBeenCalledWith(
        expect.objectContaining({
          success_url: expect.stringContaining('{CHECKOUT_SESSION_ID}'),
        })
      );
    });
  });
});
