import { ComputedRef, computed, ref } from 'vue';

export type HelpMenuControls = {
  isOpen: ComputedRef<boolean>;
  setOpen: (isOpen: boolean) => void;
  toggle: () => void;
};

export const useHelpMenuState = (): HelpMenuControls => {
  const isOpen = ref(false);

  const setOpen: HelpMenuControls['setOpen'] = (open) => (isOpen.value = open);

  return {
    isOpen: computed(() => isOpen.value),
    setOpen,
    toggle: () => setOpen(!isOpen.value),
  };
};
