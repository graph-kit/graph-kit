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

// hover and focus ask what the control is, which a disabled one has the most to answer
// for, so they stay while every other event on a button is a way of pressing it
const nonActivatingEvents = [
  'mouseenter',
  'mouseleave',
  'mouseover',
  'mouseout',
  'pointerenter',
  'pointerleave',
  'pointerover',
  'pointerout',
  'focus',
  'blur',
  'focusin',
  'focusout',
];

// `@mouse-enter.capture` reaches here as `onMouseEnterCapture`, so the event is matched
// on its own, with the casing, the hyphens and any trailing modifiers taken off
const isNonActivating = (key: string) => {
  const event = key.slice(2).replace(/-/g, '').toLowerCase();
  return nonActivatingEvents.some((name) => event.startsWith(name));
};

/**
 * an aria-disabled button still dispatches clicks, so the consumer's activation handlers
 * come off. what it does on hover or focus is explanation rather than activation and stays.
 */
export const withoutHandlers = (attrs: Record<string, unknown>) =>
  Object.fromEntries(
    Object.entries(attrs).filter(
      ([key]) => !key.startsWith('on') || isNonActivating(key),
    ),
  );
