import { EventMapToEventRegistry } from '@core/events/types';

export type SimulationEventMap = {
  onSimulationStarted: (simulationId: string) => void;
  onSimulationEnded: (simulationId: string) => void;
};

type SimulationEventRegistry = EventMapToEventRegistry<SimulationEventMap>;

export const createSimulationEventRegistry = (): SimulationEventRegistry => ({
  onSimulationStarted: new Set(),
  onSimulationEnded: new Set(),
});
