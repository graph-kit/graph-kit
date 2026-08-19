/**
 * these components sit on top of a canvas that owns the keyboard, so mousedown
 * must not pull DOM focus off it: shortcuts stay live and space cannot
 * re-trigger the last button pressed.
 *
 * only mouse-driven focus is suppressed. tab order, programmatic .focus() and
 * keyboard activation are untouched, so reka's roving focus and menu triggers
 * still work. anything that genuinely needs click focus, like a text field,
 * should not be built on these components.
 */
export const preventFocusSteal = (event: MouseEvent) => event.preventDefault();
