/**
 * @jest-environment jsdom
 */

// Mock the @imgly/background-removal module
const mockRemoveBackground = jest.fn();
jest.mock('@imgly/background-removal', () => ({
  removeBackground: mockRemoveBackground,
}));

describe('Background Removal', () => {
  let bgRemoval: typeof import('@/lib/bg-removal');

  beforeEach(async () => {
    jest.resetModules();
    jest.clearAllMocks();
    mockRemoveBackground.mockResolvedValue(
      new Blob(['removed'], { type: 'image/png' })
    );

    // Re-import to get fresh module state
    bgRemoval = await import('@/lib/bg-removal');
  });

  describe('initBgRemoval', () => {
    it('should initialize successfully', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await bgRemoval.initBgRemoval();

      expect(consoleSpy).toHaveBeenCalledWith(
        expect.stringContaining('[BG-REMOVAL]')
      );
      consoleSpy.mockRestore();
    });

    it('should only initialize once', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await bgRemoval.initBgRemoval();
      await bgRemoval.initBgRemoval();

      // The module should only be loaded once
      const loadingCalls = consoleSpy.mock.calls.filter((call) =>
        String(call[0]).includes('Loading @imgly')
      );
      expect(loadingCalls.length).toBe(1);

      consoleSpy.mockRestore();
    });
  });

  describe('removeImageBackground', () => {
    it('should remove background from image', async () => {
      const inputBlob = new Blob(['test-image'], { type: 'image/jpeg' });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      const result = await bgRemoval.removeImageBackground(inputBlob);

      expect(result).toBeInstanceOf(Blob);
      expect(result.type).toBe('image/png');
      consoleSpy.mockRestore();
    });

    it('should call the underlying removeBackground function', async () => {
      const inputBlob = new Blob(['test-image'], { type: 'image/jpeg' });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await bgRemoval.removeImageBackground(inputBlob);

      expect(mockRemoveBackground).toHaveBeenCalled();
      consoleSpy.mockRestore();
    });

    it('should pass correct options to removeBackground', async () => {
      const inputBlob = new Blob(['test-image'], { type: 'image/jpeg' });
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await bgRemoval.removeImageBackground(inputBlob);

      expect(mockRemoveBackground).toHaveBeenCalledWith(
        expect.any(Blob),
        expect.objectContaining({
          debug: true,
          device: 'cpu',
          output: { format: 'image/png', quality: 1.0 },
        })
      );
      consoleSpy.mockRestore();
    });
  });

  describe('compositeOnWhite', () => {
    it('should composite image on white background', () => {
      const canvas = document.createElement('canvas');
      const mockContext = {
        fillStyle: '',
        fillRect: jest.fn(),
        drawImage: jest.fn(),
      };
      jest.spyOn(canvas, 'getContext').mockReturnValue(mockContext as any);

      const mockImage = {
        naturalWidth: 500,
        naturalHeight: 600,
      } as HTMLImageElement;

      bgRemoval.compositeOnWhite(canvas, mockImage);

      expect(canvas.width).toBe(500);
      expect(canvas.height).toBe(600);
      expect(mockContext.fillStyle).toBe('#ffffff');
      expect(mockContext.fillRect).toHaveBeenCalledWith(0, 0, 500, 600);
      expect(mockContext.drawImage).toHaveBeenCalledWith(mockImage, 0, 0);
    });

    it('should handle null context gracefully', () => {
      const canvas = document.createElement('canvas');
      jest.spyOn(canvas, 'getContext').mockReturnValue(null);

      const mockImage = {
        naturalWidth: 500,
        naturalHeight: 600,
      } as HTMLImageElement;

      // Should not throw
      expect(() => {
        bgRemoval.compositeOnWhite(canvas, mockImage);
      }).not.toThrow();
    });
  });

  describe('isBgRemovalReady', () => {
    it('should return false before initialization', async () => {
      // Reset module to get fresh state
      jest.resetModules();
      const freshBgRemoval = await import('@/lib/bg-removal');

      expect(freshBgRemoval.isBgRemovalReady()).toBe(false);
    });

    it('should return true after initialization', async () => {
      const consoleSpy = jest.spyOn(console, 'log').mockImplementation();

      await bgRemoval.initBgRemoval();

      expect(bgRemoval.isBgRemovalReady()).toBe(true);
      consoleSpy.mockRestore();
    });
  });
});
