import { AnyFunction } from 'ts-essentials';

export type GenericEventMap = Record<string, AnyFunction>;

export type EventMapToEventRegistry<EventMap extends GenericEventMap> = {
  [EventName in keyof EventMap]: Set<EventMap[EventName]>;
};
