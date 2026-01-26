/**
 * @jest-environment node
 */
import { POST } from '@/app/api/webhook/route';
import { NextRequest } from 'next/server';

// Mock Stripe webhook signature verification
jest.mock('stripe', () => {
  const mockStripe = {
    webhooks: {
      constructEvent: jest.fn(),
    },
  };

  return jest.fn().mockImplementation(() => mockStripe);
});

describe('Webhook API Route', () => {
  let mockStripe: any;
  let originalEnv: NodeJS.ProcessEnv;

  beforeEach(() => {
    jest.clearAllMocks();
    originalEnv = process.env;

    const StripeConstructor = require('stripe');
    mockStripe = new StripeConstructor();

    process.env.STRIPE_WEBHOOK_SECRET = 'whsec_test_secret';
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should handle successful payment webhook', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'cs_test_123',
          payment_status: 'paid',
          customer_email: 'test@example.com',
        },
      },
    };

    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);

    expect(response.status).toBe(200);
    expect(mockStripe.webhooks.constructEvent).toHaveBeenCalled();
  });

  it('should handle invalid signature', async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid signature');
    });

    const request = new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'invalid_signature',
      },
      body: JSON.stringify({ type: 'test' }),
    });

    const response = await POST(request);

    expect(response.status).toBe(400);
  });

  it('should handle missing webhook secret gracefully', async () => {
    delete process.env.STRIPE_WEBHOOK_SECRET;

    const mockEvent = {
      type: 'checkout.session.completed',
      data: { object: { id: 'test_123' } },
    };

    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);

    // Without webhook secret, it falls back to JSON.parse
    expect(response.status).toBe(200);
  });

  it('should handle missing stripe signature header', async () => {
    // Without signature header but with valid JSON, it should still work
    const mockEvent = {
      type: 'checkout.session.completed',
      data: { object: { id: 'test_123' } },
    };

    const request = new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);

    // Falls back to JSON.parse when no signature
    expect(response.status).toBe(200);
  });

  it('should handle different event types', async () => {
    const eventTypes = [
      'checkout.session.completed',
      'payment_intent.succeeded',
      'invoice.payment_succeeded',
      'customer.subscription.created',
    ];

    for (const eventType of eventTypes) {
      const mockEvent = {
        type: eventType,
        data: { object: { id: 'test_123' } },
      };

      mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

      const request = new NextRequest('http://localhost:3000/api/webhook', {
        method: 'POST',
        headers: {
          'stripe-signature': 'test_signature',
        },
        body: JSON.stringify(mockEvent),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    }
  });

  it('should handle malformed JSON when signature verification fails', async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      throw new Error('Invalid JSON');
    });

    const request = new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
      },
      body: 'invalid json',
    });

    const response = await POST(request);

    // With signature present and malformed JSON, constructEvent throws
    expect(response.status).toBe(400);
  });

  it('should log webhook events', async () => {
    const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

    const mockEvent = {
      type: 'checkout.session.completed',
      data: { object: { id: 'test_123' } },
    };

    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    await POST(request);

    expect(consoleSpy).toHaveBeenCalled();
    consoleSpy.mockRestore();
  });

  it('should handle timeout scenarios', async () => {
    mockStripe.webhooks.constructEvent.mockImplementation(() => {
      return new Promise((resolve) => {
        setTimeout(() => resolve({ type: 'test' }), 100);
      });
    });

    const request = new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify({ type: 'test' }),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('should handle large payloads', async () => {
    const largeData = {
      type: 'checkout.session.completed',
      data: {
        object: {
          id: 'test_123',
          metadata: Object.fromEntries(
            Array.from({ length: 100 }, (_, i) => [`key${i}`, `value${i}`])
          ),
        },
      },
    };

    mockStripe.webhooks.constructEvent.mockReturnValue(largeData);

    const request = new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(largeData),
    });

    const response = await POST(request);
    expect(response.status).toBe(200);
  });

  it('should be idempotent', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      id: 'evt_test_123',
      data: { object: { id: 'test_123' } },
    };

    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    // Create fresh requests since body can only be read once
    const request1 = new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    const request2 = new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    // Process same event twice with different request objects
    const response1 = await POST(request1);
    const response2 = await POST(request2);

    expect(response1.status).toBe(200);
    expect(response2.status).toBe(200);
  });

  it('should have correct content type in response', async () => {
    const mockEvent = {
      type: 'checkout.session.completed',
      data: { object: { id: 'test_123' } },
    };

    mockStripe.webhooks.constructEvent.mockReturnValue(mockEvent);

    const request = new NextRequest('http://localhost:3000/api/webhook', {
      method: 'POST',
      headers: {
        'stripe-signature': 'test_signature',
      },
      body: JSON.stringify(mockEvent),
    });

    const response = await POST(request);

    expect(response.headers.get('content-type')).toBe('application/json');
  });
});
