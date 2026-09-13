import { HistoryControls } from '@graph/plugins/history/types';

import { computed, ref } from 'vue';

export const useHistory = (history: HistoryControls) => {
  const refresh = ref(0);
  history.events.subscribe('onHistoryChanged', () => refresh.value++);
  return {
    ...history,
    canUndo: computed(() => {
      void refresh.value;
      return history.canUndo();
    }),
    canRedo: computed(() => {
      void refresh.value;
      return history.canRedo();
    }),
  };
};
