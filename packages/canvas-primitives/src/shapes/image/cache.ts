type ImageCacheEntry = {
  image: HTMLImageElement | null;
  loading: boolean;
  error: boolean;
};

const imageCache = new Map<string, ImageCacheEntry>();

export type LoadImageOptions = {
  onLoad: () => void;
  onLoadError: () => void;
};

/**
 * What is known about `src` right now, starting the load on the first ask.
 *
 * Sync because a draw that awaits its own image lands after every shape in the frame,
 * whatever priority it was handed, painting images over the scene rather than in it
 */
export const resolveImage = (
  src: string,
  options: Partial<LoadImageOptions>,
): ImageCacheEntry => {
  const cached = imageCache.get(src);
  if (cached) return cached;

  const entry: ImageCacheEntry = {
    image: null,
    loading: true,
    error: false,
  };

  imageCache.set(src, entry);

  const img = new Image();

  img.onload = () => {
    entry.image = img;
    entry.loading = false;
    options.onLoad?.();
  };

  img.onerror = () => {
    entry.loading = false;
    entry.error = true;
    options.onLoadError?.();
  };

  img.src = src;

  return entry;
};
