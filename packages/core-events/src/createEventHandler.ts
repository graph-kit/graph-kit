import type { AnyFunction } from 'ts-essentials';

import { getSortedByPriority } from './getSortedByPriority.ts';
import { GenericEventMap } from './types.ts';

export type HandlerPriority<HandlerId extends string = string> = {
  /** all registered handlers that we you want to yield to */
  before: readonly HandlerId[];
};

export type WithConsume<Callback extends AnyFunction> = (
  ...args: [...Parameters<Callback>, consume: () => void]
) => ReturnType<Callback>;

type HandlerData<Callback extends AnyFunction, HandlerId extends string> = {
  id: HandlerId | undefined;
  priority: HandlerPriority<HandlerId>;
  callback: WithConsume<Callback>;
};

type HandlerRecord<
  EventMap extends GenericEventMap,
  HandlerId extends string,
> = {
  [EventName in keyof EventMap]?: HandlerData<EventMap[EventName], HandlerId>[];
};

export const createEventHandler = <
  EventMap extends GenericEventMap,
  HandlerId extends string = string,
>() => {
  const allHandlers: HandlerRecord<EventMap, HandlerId> = {};
  return {
    handle: <EventName extends keyof EventMap>(
      eventName: EventName,
      eventCallback: WithConsume<EventMap[EventName]>,
      handlerId: HandlerId,
      priority: HandlerPriority<HandlerId> = { before: [] },
    ) => {
      const handlers = allHandlers[eventName] ?? [];
      if (handlers.some(({ callback }) => callback === eventCallback)) return;

      allHandlers[eventName] = getSortedByPriority([
        ...handlers,
        { id: handlerId, callback: eventCallback, priority },
      ]);
    },
    unhandle: <EventName extends keyof EventMap>(
      eventName: EventName,
      eventCallback: WithConsume<EventMap[EventName]>,
    ) => {
      const handlers = allHandlers[eventName];
      if (!handlers) return;
      allHandlers[eventName] = handlers.filter(
        ({ callback }) => callback !== eventCallback,
      );
    },
    fireHandlers: <EventName extends keyof EventMap>(
      eventName: EventName,
      ...callbackArgs: Parameters<EventMap[EventName]>
    ) => {
      const handlers = allHandlers[eventName];
      if (!handlers) return;
      let consumed = false;
      const consume = () => {
        consumed = true;
      };
      for (const { callback } of handlers) {
        if (consumed) return;
        callback(...callbackArgs, consume);
      }
    },
  };
};
