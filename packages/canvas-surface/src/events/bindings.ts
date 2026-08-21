export type ElementBinding = {
  bind: (element: HTMLElement) => void;
  unbind: (element: HTMLElement) => void;
};

export type DocumentBinding = {
  bind: () => void;
  unbind: () => void;
};

/**
 * pairs a listener with the element methods that add and remove it, so the
 * event name is written once and the listener's argument stays typed after the
 * event name is erased to store bindings side by side in a list.
 */
export const createBinding = <EventName extends keyof HTMLElementEventMap>(
  event: EventName,
  listener: (ev: HTMLElementEventMap[EventName]) => void,
  options?: AddEventListenerOptions,
): ElementBinding => ({
  bind: (element: HTMLElement) =>
    element.addEventListener(event, listener, options),
  unbind: (element: HTMLElement) =>
    element.removeEventListener(event, listener),
});

export const createDocumentBinding = <EventName extends keyof DocumentEventMap>(
  event: EventName,
  listener: (ev: DocumentEventMap[EventName]) => void,
  options?: AddEventListenerOptions,
): DocumentBinding => ({
  bind: () => document.addEventListener(event, listener, options),
  unbind: () => document.removeEventListener(event, listener),
});
