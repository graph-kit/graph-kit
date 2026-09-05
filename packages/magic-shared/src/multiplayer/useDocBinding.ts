import { shallowRef } from 'vue';

import {
  DocBinding,
  MultiplayerControls,
  ProductControls,
} from '../product/types.ts';

export type BoundProductControls = {
  /** the controls to register with, wrapping bind so what it makes is kept */
  controls: MultiplayerControls;
  binding: ReturnType<typeof shallowRef<DocBinding>>;
};

/**
 * The binding is made by the product at a moment only the connection knows about, and more
 * than one part of the shell needs what it hands back. Wrapping bind is how the
 * shell gets hold of it without owning when it happens.
 */
export const useDocBinding = (
  product: ProductControls,
): BoundProductControls => {
  const binding = shallowRef<DocBinding>();

  return {
    binding,
    controls: {
      ...product.multiplayer,
      bind: (doc, mode) => {
        const made = product.multiplayer.bind(doc, mode);
        binding.value = made;
        return made;
      },
    },
  };
};
