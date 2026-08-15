import { computed, shallowRef, watch } from 'vue';

import { MultiplayerControls } from '../../multiplayer/types.ts';
import {
  HistoryField,
  MagicProductHost,
  MultiplayerHostField,
} from '../types.ts';

export type ProductHistoryOptions = {
  host: MagicProductHost;
  multiplayer: MultiplayerControls | undefined;
};

export type ProductHistory = {
  history: HistoryField | undefined;
  /** the host to register with, wrapping bind so the session's undo is picked up */
  multiplayerHost: MultiplayerHostField;
};

/**
 * One history API for consumers. A multiplayer session swaps in the host's document
 * scoped undo, since replaying whole local states over a session would take a peer's
 * work with it.
 */
export const useProductHistory = ({
  host,
  multiplayer,
}: ProductHistoryOptions): ProductHistory => {
  const inRoom = computed(() => multiplayer?.room.value.connected === true);

  // handed over on bind, the only moment both the document and what the host keeps in
  // it are known
  const roomHistory = shallowRef<HistoryField>();
  const multiplayerHost: MultiplayerHostField = {
    bind: (doc) => (roomHistory.value = host.multiplayer.bind(doc)),
  };

  const active = () => (inRoom.value ? roomHistory.value : host.history);

  // joining and leaving each make what is on screen a new starting point, the same way
  // a restore does
  watch(inRoom, () => host.history?.clear());

  const history: HistoryField | undefined = host.history && {
    canUndo: computed(() => active()?.canUndo.value === true),
    canRedo: computed(() => active()?.canRedo.value === true),
    undo: () => active()?.undo(),
    redo: () => active()?.redo(),
    clear: () => active()?.clear(),
  };

  return { history, multiplayerHost };
};
