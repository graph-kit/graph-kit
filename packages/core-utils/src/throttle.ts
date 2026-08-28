/**
 * a function that runs at most once every `ms`, dropping the calls made in between
 *
 * @param fn target function
 * @param ms time in milliseconds
 * @returns a throttled function
 */
export const throttle = <T extends () => void>(fn: T, ms: number) => {
  let lastRunAt = 0;

  return () => {
    const now = Date.now();
    if (now - lastRunAt < ms) return;
    lastRunAt = now;
    fn();
  };
};
