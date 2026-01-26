/**
 * @jest-environment node
 */
import sitemap from '@/app/sitemap';

describe('Sitemap', () => {
  const originalEnv = process.env;

  beforeEach(() => {
    jest.resetModules();
    process.env = { ...originalEnv };
  });

  afterEach(() => {
    process.env = originalEnv;
  });

  it('should return an array of sitemap entries', () => {
    const result = sitemap();
    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should include the homepage', () => {
    const result = sitemap();
    const homepage = result.find(
      (entry) => entry.url.endsWith('/') || !entry.url.includes('/app')
    );
    expect(homepage).toBeDefined();
    expect(homepage?.priority).toBe(1);
  });

  it('should include the app page', () => {
    const result = sitemap();
    const appPage = result.find((entry) => entry.url.includes('/app'));
    expect(appPage).toBeDefined();
    expect(appPage?.priority).toBe(0.8);
  });

  it('should use NEXT_PUBLIC_BASE_URL when set', () => {
    process.env.NEXT_PUBLIC_BASE_URL = 'https://custom-domain.com';
    const result = sitemap();
    expect(result[0].url).toContain('custom-domain.com');
  });

  it('should use default URL when NEXT_PUBLIC_BASE_URL is not set', () => {
    delete process.env.NEXT_PUBLIC_BASE_URL;
    const result = sitemap();
    expect(result[0].url).toContain('photoid.app');
  });

  it('should have lastModified dates', () => {
    const result = sitemap();
    result.forEach((entry) => {
      expect(entry.lastModified).toBeInstanceOf(Date);
    });
  });

  it('should have changeFrequency values', () => {
    const result = sitemap();
    result.forEach((entry) => {
      expect([
        'always',
        'hourly',
        'daily',
        'weekly',
        'monthly',
        'yearly',
        'never',
      ]).toContain(entry.changeFrequency);
    });
  });

  it('should have valid priority values', () => {
    const result = sitemap();
    result.forEach((entry) => {
      expect(entry.priority).toBeGreaterThanOrEqual(0);
      expect(entry.priority).toBeLessThanOrEqual(1);
    });
  });
});
