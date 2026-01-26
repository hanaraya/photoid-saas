/**
 * @jest-environment node
 */
import { GET } from '@/app/api/verify-session/route';

// Mock Stripe
const mockRetrieve = jest.fn();
jest.mock('stripe', () => {
  return jest.fn().mockImplementation(() => ({
    checkout: {
      sessions: {
        retrieve: mockRetrieve,
      },
    },
  }));
});

describe('Verify Session API Route', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.clearAllMocks();
    process.env = { ...originalEnv };
    process.env.STRIPE_SECRET_KEY = 'sk_test_fake_key';
  });

  afterAll(() => {
    process.env = originalEnv;
  });

  describe('Input Validation', () => {
    it('should return error when STRIPE_SECRET_KEY is not set', async () => {
      delete process.env.STRIPE_SECRET_KEY;

      const request = new Request('http://localhost/api/verify-session?session_id=cs_test_123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Stripe is not configured');
    });

    it('should return error when session_id is missing', async () => {
      const request = new Request('http://localhost/api/verify-session');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Missing session_id parameter');
    });

    it('should return error when session_id has invalid format', async () => {
      const request = new Request('http://localhost/api/verify-session?session_id=invalid_123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid session_id format');
    });

    it('should accept valid session_id format starting with cs_', async () => {
      mockRetrieve.mockResolvedValue({
        id: 'cs_test_123',
        payment_status: 'paid',
        created: Math.floor(Date.now() / 1000), // Recent session
        customer_details: { email: 'test@example.com' },
      });

      const request = new Request('http://localhost/api/verify-session?session_id=cs_test_123');
      const response = await GET(request);

      expect(response.status).toBe(200);
      expect(mockRetrieve).toHaveBeenCalledWith('cs_test_123');
    });
  });

  describe('Session Expiry', () => {
    it('should reject sessions older than 1 hour', async () => {
      const twoHoursAgo = Math.floor(Date.now() / 1000) - 7200;
      mockRetrieve.mockResolvedValue({
        id: 'cs_test_old_session',
        payment_status: 'paid',
        created: twoHoursAgo,
      });

      const request = new Request('http://localhost/api/verify-session?session_id=cs_test_old_session');
      const response = await GET(request);
      const data = await response.json();

      expect(data.verified).toBe(false);
      expect(data.error).toBe('Payment session expired. Please make a new payment.');
    });

    it('should accept sessions created within the last hour', async () => {
      const thirtyMinutesAgo = Math.floor(Date.now() / 1000) - 1800;
      mockRetrieve.mockResolvedValue({
        id: 'cs_test_recent',
        payment_status: 'paid',
        created: thirtyMinutesAgo,
        customer_details: { email: 'test@example.com' },
      });

      const request = new Request('http://localhost/api/verify-session?session_id=cs_test_recent');
      const response = await GET(request);
      const data = await response.json();

      expect(data.verified).toBe(true);
    });

    it('should accept sessions created just now', async () => {
      const now = Math.floor(Date.now() / 1000);
      mockRetrieve.mockResolvedValue({
        id: 'cs_test_now',
        payment_status: 'paid',
        created: now,
        customer_details: null,
      });

      const request = new Request('http://localhost/api/verify-session?session_id=cs_test_now');
      const response = await GET(request);
      const data = await response.json();

      expect(data.verified).toBe(true);
    });

    it('should reject sessions exactly 1 hour old', async () => {
      const oneHourAgo = Math.floor(Date.now() / 1000) - 3600;
      mockRetrieve.mockResolvedValue({
        id: 'cs_test_edge',
        payment_status: 'paid',
        created: oneHourAgo - 1, // Just over 1 hour
      });

      const request = new Request('http://localhost/api/verify-session?session_id=cs_test_edge');
      const response = await GET(request);
      const data = await response.json();

      expect(data.verified).toBe(false);
    });
  });

  describe('Payment Verification', () => {
    it('should return verified true when payment_status is paid', async () => {
      mockRetrieve.mockResolvedValue({
        id: 'cs_test_paid_session',
        payment_status: 'paid',
        created: Math.floor(Date.now() / 1000),
        customer_details: { email: 'customer@example.com' },
      });

      const request = new Request('http://localhost/api/verify-session?session_id=cs_test_paid_session');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verified).toBe(true);
      expect(data.sessionId).toBe('cs_test_paid_session');
      expect(data.email).toBe('customer@example.com');
    });

    it('should return verified false when payment_status is unpaid', async () => {
      mockRetrieve.mockResolvedValue({
        id: 'cs_test_unpaid',
        payment_status: 'unpaid',
        created: Math.floor(Date.now() / 1000),
      });

      const request = new Request('http://localhost/api/verify-session?session_id=cs_test_unpaid');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(200);
      expect(data.verified).toBe(false);
      expect(data.error).toBe('Payment not completed');
      expect(data.status).toBe('unpaid');
    });

    it('should return verified false when payment_status is no_payment_required', async () => {
      mockRetrieve.mockResolvedValue({
        id: 'cs_test_no_payment',
        payment_status: 'no_payment_required',
        created: Math.floor(Date.now() / 1000),
      });

      const request = new Request('http://localhost/api/verify-session?session_id=cs_test_no_payment');
      const response = await GET(request);
      const data = await response.json();

      expect(data.verified).toBe(false);
    });

    it('should handle missing customer_details gracefully', async () => {
      mockRetrieve.mockResolvedValue({
        id: 'cs_test_no_email',
        payment_status: 'paid',
        created: Math.floor(Date.now() / 1000),
        customer_details: null,
      });

      const request = new Request('http://localhost/api/verify-session?session_id=cs_test_no_email');
      const response = await GET(request);
      const data = await response.json();

      expect(data.verified).toBe(true);
      expect(data.email).toBeNull();
    });
  });

  describe('Error Handling', () => {
    it('should return 404 when session not found in Stripe', async () => {
      const stripeError = new Error('No such checkout session');
      (stripeError as any).code = 'resource_missing';
      mockRetrieve.mockRejectedValue(stripeError);

      // Mock Stripe errors class
      const Stripe = require('stripe');
      Stripe.errors = { StripeError: Error };

      const request = new Request('http://localhost/api/verify-session?session_id=cs_test_nonexistent');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(404);
      expect(data.error).toBe('Session not found');
      expect(data.verified).toBe(false);
    });

    it('should return 500 on general Stripe errors', async () => {
      mockRetrieve.mockRejectedValue(new Error('Connection failed'));

      const request = new Request('http://localhost/api/verify-session?session_id=cs_test_error');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(500);
      expect(data.error).toBe('Failed to verify session');
      expect(data.verified).toBe(false);
    });
  });

  describe('Security', () => {
    it('should not expose sensitive session data', async () => {
      mockRetrieve.mockResolvedValue({
        id: 'cs_test_secure',
        payment_status: 'paid',
        created: Math.floor(Date.now() / 1000),
        customer_details: { email: 'test@example.com' },
        // These should NOT be returned
        amount_total: 499,
        currency: 'usd',
        payment_intent: 'pi_secret_123',
        customer: 'cus_secret_456',
      });

      const request = new Request('http://localhost/api/verify-session?session_id=cs_test_secure');
      const response = await GET(request);
      const data = await response.json();

      // Should only return safe fields
      expect(data).toEqual({
        verified: true,
        sessionId: 'cs_test_secure',
        email: 'test@example.com',
      });

      // Should NOT expose sensitive data
      expect(data.amount_total).toBeUndefined();
      expect(data.payment_intent).toBeUndefined();
      expect(data.customer).toBeUndefined();
    });

    it('should reject session_id not starting with cs_', async () => {
      // Attempt to bypass with different prefix
      const request = new Request('http://localhost/api/verify-session?session_id=pi_test_123');
      const response = await GET(request);
      const data = await response.json();

      expect(response.status).toBe(400);
      expect(data.error).toBe('Invalid session_id format');
    });

    it('should pass valid session_id to Stripe as-is', async () => {
      mockRetrieve.mockResolvedValue({
        id: 'cs_test_valid123',
        payment_status: 'paid',
        created: Math.floor(Date.now() / 1000),
      });

      const request = new Request('http://localhost/api/verify-session?session_id=cs_test_valid123');
      await GET(request);

      // Verify the exact session_id was passed to Stripe
      expect(mockRetrieve).toHaveBeenCalledWith('cs_test_valid123');
    });
  });
});
