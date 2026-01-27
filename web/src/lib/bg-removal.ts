let removeBackground: ((image: Blob) => Promise<Blob>) | null = null;
let initPromise: Promise<void> | null = null;
let initError: Error | null = null;

export function resetBgRemoval(): void {
  removeBackground = null;
  initPromise = null;
  initError = null;
}

export function getBgRemovalError(): Error | null {
  return initError;
}

export async function initBgRemoval(): Promise<void> {
  if (removeBackground) return;
  if (initError) {
    throw initError;
  }
  if (initPromise) return initPromise;

  initPromise = (async () => {
    try {
      console.log('[BG-REMOVAL] Loading @imgly/background-removal module...');
      const bgModule = await import('@imgly/background-removal');
      console.log('[BG-REMOVAL] Module loaded. Exports:', Object.keys(bgModule));
      // Store reference — the default export or named export
      const removeBg = bgModule.removeBackground || bgModule.default;
      if (typeof removeBg !== 'function') {
        throw new Error('removeBackground function not found in module');
      }
      console.log('[BG-REMOVAL] removeBackground function ready');
      removeBackground = async (image: Blob): Promise<Blob> => {
        console.log('[BG-REMOVAL] Starting removal... input size:', image.size);
        try {
          const result = await removeBg(image, {
            debug: true,
            device: 'cpu', // Force CPU - more reliable than GPU/WebGPU
            output: { format: 'image/png', quality: 1.0 },
          });
          console.log(
            '[BG-REMOVAL] Done! Result type:',
            result.type,
            'size:',
            result.size
          );
          return result;
        } catch (removalErr) {
          console.error('[BG-REMOVAL] Removal failed:', removalErr);
          throw removalErr;
        }
      };
    } catch (err) {
      console.error('[BG-REMOVAL] Init failed:', err);
      initError = err instanceof Error ? err : new Error(String(err));
      initPromise = null;
      throw initError;
    }
  })();

  return initPromise;
}

export async function removeImageBackground(imageBlob: Blob): Promise<Blob> {
  await initBgRemoval();
  if (!removeBackground) {
    throw new Error('Background removal not initialized');
  }
  return removeBackground(imageBlob);
}

/**
 * Composite the transparent PNG onto a white background
 */
export function compositeOnWhite(
  canvas: HTMLCanvasElement,
  transparentImage: HTMLImageElement
): void {
  const ctx = canvas.getContext('2d');
  if (!ctx) return;

  canvas.width = transparentImage.naturalWidth;
  canvas.height = transparentImage.naturalHeight;

  // Fill with white first
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw transparent image on top
  ctx.drawImage(transparentImage, 0, 0);
}

export function isBgRemovalReady(): boolean {
  return removeBackground !== null;
}
