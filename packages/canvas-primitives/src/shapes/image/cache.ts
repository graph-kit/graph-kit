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
 * What is known about `src` right now, starting the load on the first ask and filling the
 * same entry in once it settles.
 *
 * Synchronous because a draw that awaits its own image runs after every shape painted in
 * the same frame, whatever priority it was handed, which puts every image on top of the
 * scene rather than in it. Callers ask again next frame instead of waiting
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
