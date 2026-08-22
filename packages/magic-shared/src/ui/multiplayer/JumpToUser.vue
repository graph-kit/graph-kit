<script setup lang="ts">
  import { mdiArrowRightBold } from '@mdi/js';
  import { RosterEntry } from '@multiplayer/protocol/room';

  import { computed } from 'vue';

  import MenuItem from '../../components/dropdown/MenuItem.vue';
  import { jumpUserIdUrl } from '../../multiplayer/url.ts';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';
  import { useProvidedMagic } from '../../product/context.ts';
  import { manifests } from '../../product/manifests/index.ts';
  import { assertIsProductId } from '../../product/manifests/isValidProductId.ts';
  import { productHref } from '../navigation-menu/navigateToProduct.ts';

  interface Props {
    member: RosterEntry;
  }

  const props = defineProps<Props>();

  const magic = useProvidedMagic();
  const { room } = useConnectedMultiplayer();

  const inSameProduct = computed(
    () => props.member.productId === magic.manifest.id,
  );

  /**
   * a jump into another experience is a navigation, so it is a real link, which is what
   * gets it a middle click and a copyable address. undefined on the same experience,
   * where the jump is only a camera move and there is no page to point at
   */
  const href = computed(() => {
    const { productId, userId } = props.member;
    if (productId === null || inSameProduct.value) return undefined;
    assertIsProductId(productId);
    return productHref(manifests[productId], jumpUserIdUrl.params(userId));
  });

  /** only the jump that stays put; the one that navigates belongs to the link */
  const jump = () => {
    if (!inSameProduct.value) return;
    const camera =
      room.value.userIdToPresence[props.member.userId]?.cameraState;
    if (!camera) return;
    magic.surface.camera.actions.moveTo(camera);
  };
</script>

<template>
  <MenuItem
    :href="href"
    :icon="mdiArrowRightBold"
    :disabled="member.productId === null ? 'Not in an experience yet' : false"
    @click="jump"
  >
    Jump To {{ member.displayName }}
  </MenuItem>
</template>
