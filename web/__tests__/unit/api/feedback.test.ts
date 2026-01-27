/**
 * @jest-environment node
 */
import { POST } from '@/app/api/feedback/route';
import { NextRequest } from 'next/server';

// Mock fetch for Telegram
global.fetch = jest.fn();

describe('Feedback API', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (global.fetch as jest.Mock).mockResolvedValue({ ok: true });
  });

  const createRequest = (body: object) => {
    return new NextRequest('http://localhost:3000/api/feedback', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });
  };

  it('should accept valid feedback with rating only', async () => {
    const request = createRequest({
      rating: 5,
      timestamp: new Date().toISOString(),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should accept valid feedback with rating and comment', async () => {
    const request = createRequest({
      rating: 4,
      comment: 'Great service!',
      photoStandard: 'US Passport',
      timestamp: new Date().toISOString(),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should reject rating below 1', async () => {
    const request = createRequest({
      rating: 0,
      timestamp: new Date().toISOString(),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid rating');
  });

  it('should reject rating above 5', async () => {
    const request = createRequest({
      rating: 6,
      timestamp: new Date().toISOString(),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid rating');
  });

  it('should reject missing rating', async () => {
    const request = createRequest({
      comment: 'No rating provided',
      timestamp: new Date().toISOString(),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Invalid rating');
  });

  it('should reject comment longer than 500 characters', async () => {
    const longComment = 'a'.repeat(501);
    const request = createRequest({
      rating: 3,
      comment: longComment,
      timestamp: new Date().toISOString(),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe('Comment too long');
  });

  it('should accept comment exactly 500 characters', async () => {
    const exactComment = 'a'.repeat(500);
    const request = createRequest({
      rating: 3,
      comment: exactComment,
      timestamp: new Date().toISOString(),
    });

    const response = await POST(request);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it('should handle all rating values 1-5', async () => {
    for (let rating = 1; rating <= 5; rating++) {
      const request = createRequest({
        rating,
        timestamp: new Date().toISOString(),
      });

      const response = await POST(request);
      expect(response.status).toBe(200);
    }
  });
});
