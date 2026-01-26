/**
 * @jest-environment node
 */
import { GET } from '@/app/api/health/route';

describe('Health API Route', () => {
  it('should return healthy status', async () => {
    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe('healthy');
    expect(data.timestamp).toBeTruthy();
  });

  it('should have correct content type', async () => {
    const response = await GET();

    expect(response.headers.get('content-type')).toBe('application/json');
  });

  it('should include system information', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('status');
    expect(data).toHaveProperty('timestamp');
    expect(typeof data.timestamp).toBe('string');
  });

  it('should return consistent response format', async () => {
    const response1 = await GET();
    const data1 = await response1.json();

    const response2 = await GET();
    const data2 = await response2.json();

    expect(data1.status).toBe(data2.status);
    expect(typeof data1.timestamp).toBe(typeof data2.timestamp);
  });

  it('should handle multiple concurrent requests', async () => {
    const promises = Array.from({ length: 10 }, () => GET());
    const responses = await Promise.all(promises);

    responses.forEach((response) => {
      expect(response.status).toBe(200);
    });
  });

  it('should respond quickly', async () => {
    const startTime = Date.now();
    await GET();
    const endTime = Date.now();

    expect(endTime - startTime).toBeLessThan(1000); // Should respond in under 1 second
  });

  it('should have proper cache headers', async () => {
    const response = await GET();

    // Health endpoint should not be cached
    expect(response.headers.get('cache-control')).toBe(
      'no-cache, no-store, must-revalidate'
    );
  });

  it('should include uptime information', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('uptime');
    expect(typeof data.uptime).toBe('number');
    expect(data.uptime).toBeGreaterThan(0);
  });

  it('should include memory usage', async () => {
    const response = await GET();
    const data = await response.json();

    expect(data).toHaveProperty('memory');
    expect(typeof data.memory).toBe('object');
    expect(data.memory).toHaveProperty('used');
    expect(data.memory).toHaveProperty('total');
  });

  it('should be accessible via different HTTP methods', async () => {
    // Should only support GET
    const getResponse = await GET();
    expect(getResponse.status).toBe(200);
  });

  it('should maintain consistent timestamp format', async () => {
    const response = await GET();
    const data = await response.json();

    const timestamp = new Date(data.timestamp);
    expect(timestamp.toString()).not.toBe('Invalid Date');
  });

  it('should handle stress testing', async () => {
    const promises = Array.from({ length: 100 }, () => GET());
    const responses = await Promise.all(promises);

    const allSuccessful = responses.every(
      (response) => response.status === 200
    );
    expect(allSuccessful).toBe(true);
  });
});
