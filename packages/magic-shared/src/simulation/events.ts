import { EventMapToEventRegistry } from '@core/events/types';

export type SimulationEventMap = {
  onSimulationStarted: () => void;
  onSimulationEnded: () => void;
};

type SimulationEventRegistry = EventMapToEventRegistry<SimulationEventMap>;

export const createSimulationEventRegistry = (): SimulationEventRegistry => ({
  onSimulationStarted: new Set(),
  onSimulationEnded: new Set(),
});
