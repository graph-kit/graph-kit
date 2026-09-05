import type {
  AnnotationsChange,
  AnnotationsControls,
} from '@core/annotations/index';
import type { HistoryField } from '@magic/shared/product';

import { computed, ref } from 'vue';

import type { SetDefinitions } from '../setDefinitions.ts';
import type { SetGestures } from '../setGestures.ts';
import type { SetDefinition } from '../types.ts';

const MAX_HISTORY = 100;

type HistoryStep =
  | { kind: 'sets'; before: SetDefinition[]; after: SetDefinition[] }
  | { kind: 'annotations'; change: AnnotationsChange };

export type SetsHistoryParts = {
  sets: SetDefinitions;
  annotations: AnnotationsControls;
  gestures: SetGestures;
};

/*
  snapshots carry ids, unlike the ones transit puts in a link. an undo returns to a canvas
  the user is still looking at, where the id is what focus is holding, what a gesture in
  flight is moving and what a room knows a circle by. minting new ones would drop the
  selection and read to a peer as every set being removed and put back
*/
const snapshotOf = (sets: SetDefinitions): SetDefinition[] =>
  sets.definitions.value.map(({ id, label, display }) => ({
    id,
    label,
    display: { at: { ...display.at }, radius: display.radius },
  }));

export const createSetsHistory = ({
  sets,
  annotations,
  gestures,
}: SetsHistoryParts): HistoryField => {
  const steps: HistoryStep[] = [];
  /** the last step taken, so undo reverses it and redo takes the one above */
  let cursor = -1;

  /** what the canvas held as of the cursor, the `before` of whatever is recorded next */
  let heldSets = snapshotOf(sets);

  /*
    a restore writes through the same stores everything else does, and they report it the
    same way. the flag is what tells walking back from being walked back, and it holds
    because every one of these events is triggered inside the write's own stack frame
  */
  let restoring = false;

  // canUndo and canRedo are read from a template, and none of the above is reactive
  const revision = ref(0);
  const changed = () => revision.value++;

  const record = (step: HistoryStep) => {
    // anything above the cursor belongs to a branch undo walked away from. left in place
    // it stays reachable, and redo would arrive at a state the canvas never came from
    steps.splice(cursor + 1);
    steps.push(step);
    if (steps.length > MAX_HISTORY) steps.shift();
    cursor = steps.length - 1;
    changed();
  };

  const recordSets = () => {
    if (restoring) return;

    const after = snapshotOf(sets);
    // a press that let go where it started is not a step, and neither is a gesture that
    // put a circle back where it found it
    if (JSON.stringify(after) === JSON.stringify(heldSets)) return;

    record({ kind: 'sets', before: heldSets, after });
    heldSets = after;
  };

  const write = (apply: () => void) => {
    restoring = true;
    try {
      apply();
    } finally {
      restoring = false;
    }
  };

  const applySets = (snapshot: SetDefinition[]) => {
    // setAll copies what it admits, so the step keeps holding its own arrays
    write(() => sets.setAll(snapshot));
    heldSets = snapshot;
  };

  const applyAnnotations = ({ added, removed }: AnnotationsChange) =>
    write(() => {
      annotations.remove(added.map(({ id }) => id));
      annotations.add(removed);
    });

  const stepBackward = (step: HistoryStep) => {
    if (step.kind === 'sets') return applySets(step.before);
    applyAnnotations(step.change);
  };

  const stepForward = (step: HistoryStep) => {
    if (step.kind === 'sets') return applySets(step.after);
    // the inverse of the inverse, so the same write with the two halves swapped
    applyAnnotations({
      added: step.change.removed,
      removed: step.change.added,
    });
  };

  sets.events.subscribe('onDefinitionsChanged', recordSets);
  gestures.events.subscribe('onGestureEnded', recordSets);

  annotations.events.subscribe('onAnnotationsChanged', (change) => {
    if (restoring) return;
    record({
      kind: 'annotations',
      change: { added: [...change.added], removed: [...change.removed] },
    });
  });

  return {
    canUndo: computed(() => {
      revision.value;
      return cursor >= 0;
    }),
    canRedo: computed(() => {
      revision.value;
      return cursor < steps.length - 1;
    }),

    undo: () => {
      const step = steps[cursor];
      if (!step) return;
      stepBackward(step);
      cursor--;
      changed();
    },

    redo: () => {
      const step = steps[cursor + 1];
      if (!step) return;
      stepForward(step);
      cursor++;
      changed();
    },

    clear: () => {
      steps.length = 0;
      cursor = -1;
      heldSets = snapshotOf(sets);
      changed();
    },
  };
};
