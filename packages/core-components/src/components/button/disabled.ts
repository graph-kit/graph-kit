import { cn } from '../../cn.ts';

// hover and active styling reads as interactive, which a disabled control is not
const interactiveVariant = /(^|:)(hover|active):/;

/**
 * a disabled button keeps its pointer events so the tooltip explaining it can open,
 * so none of the suppression a native `disabled` would bring is happening for free.
 */
export const disabledClasses = (classes: string) =>
  cn(
    classes
      .split(' ')
      .filter((token) => !interactiveVariant.test(token))
      .join(' '),
    'cursor-not-allowed opacity-50',
  );

/** an aria-disabled button still dispatches clicks, so the consumer's handlers come off */
export const withoutHandlers = (attrs: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(attrs).filter(([key]) => !key.startsWith('on')),
  );
