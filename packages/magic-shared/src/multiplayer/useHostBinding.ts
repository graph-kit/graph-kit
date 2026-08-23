import { shallowRef } from 'vue';

import {
  HostBinding,
  MagicProductHost,
  MultiplayerHostField,
} from '../product/types.ts';

export type ProductHostBinding = {
  /** the host to register with, wrapping bind so what it makes is kept */
  multiplayerHost: MultiplayerHostField;
  binding: ReturnType<typeof shallowRef<HostBinding>>;
};

/**
 * The binding is made by the host at a moment only the connection knows about, and more
 * than one part of the harness needs what it hands back. Wrapping bind is how the
 * harness gets hold of it without owning when it happens.
 */
export const useHostBinding = (host: MagicProductHost): ProductHostBinding => {
  const binding = shallowRef<HostBinding>();

  return {
    binding,
    multiplayerHost: {
      ...host.multiplayer,
      bind: (doc, mode) => {
        const made = host.multiplayer.bind(doc, mode);
        binding.value = made;
        return made;
      },
    },
  };
};
