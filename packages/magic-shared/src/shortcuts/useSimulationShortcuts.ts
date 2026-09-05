import { Shell } from '../product/types.ts';
import { ShortcutItem } from './useShortcuts.ts';

export const useSimulationShortcuts = (shell: Shell): ShortcutItem[] => [
  {
    id: 'shell/simulation/stop',
    helpMenu: { category: 'Simulation', name: 'Stop Simulation' },
    key: 'escape',
    callback: () => {
      if (!shell.simulation.current.value) return;
      shell.simulation.stop();
    },
  },
  {
    id: 'shell/simulation/previous-frame',
    helpMenu: { category: 'Simulation', name: 'Previous Frame' },
    key: 'left',
    callback: () => {
      const simulation = shell.simulation.current.value;
      if (!simulation || simulation.violation) return;
      if (simulation.playhead.isFirst()) return;
      simulation.playhead.prev();
    },
  },
  {
    id: 'shell/simulation/next-frame',
    helpMenu: { category: 'Simulation', name: 'Next Frame' },
    key: 'right',
    callback: () => {
      const simulation = shell.simulation.current.value;
      if (!simulation || simulation.violation) return;
      if (simulation.playhead.isLast()) return;
      simulation.playhead.next();
    },
  },
];
