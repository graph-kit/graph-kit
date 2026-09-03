/**
 * A fixed window rather than a token bucket: what these guard is triggered by hand a few
 * times a minute, so the only thing that has to hold is that a script cannot loop them.
 */
export type RateLimit = {
  /** @returns whether this attempt is within the window's allowance */
  allow: () => boolean;
};

export const createRateLimit = (limit: number, windowMs: number): RateLimit => {
  let windowStartedAt = 0;
  let attempts = 0;

  return {
    allow: () => {
      const now = Date.now();
      if (now - windowStartedAt > windowMs) {
        windowStartedAt = now;
        attempts = 0;
      }
      attempts += 1;
      return attempts <= limit;
    },
  };
};
