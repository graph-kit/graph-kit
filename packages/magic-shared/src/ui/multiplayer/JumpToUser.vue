<script setup lang="ts">
  import { mdiArrowRightBold } from '@mdi/js';
  import { RosterEntry } from '@multiplayer/protocol/room';

  import { computed } from 'vue';

  import MenuItem from '../../components/dropdown/MenuItem.vue';
  import { jumpUserIdUrl } from '../../multiplayer/url.ts';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';
  import { useProvidedMagic } from '../../product/context.ts';
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

  const hrefToMemberInOtherProduct = computed(() => {
    const { productId, userId } = props.member;
    if (productId === null || inSameProduct.value) return undefined;
    return productHref(productId, jumpUserIdUrl.params(userId));
  });

  const cameraToJumpTo = computed(
    () => room.value.userIdToPresence[props.member.userId]?.cameraState,
  );

  const disabledReason = computed(() => {
    if (props.member.productId === null) return 'Not in an experience yet';
    if (inSameProduct.value && !cameraToJumpTo.value)
      return `Waiting for ${props.member.displayName} to settle in`;
    return false;
  });

  const matchMemberCameraWithoutNavigating = () => {
    const camera = cameraToJumpTo.value;
    if (!inSameProduct.value || !camera) return;
    magic.surface.camera.actions.moveTo(camera);
  };
</script>

<template>
  <MenuItem
    :href="hrefToMemberInOtherProduct"
    :icon="mdiArrowRightBold"
    :disabled="disabledReason"
    @click="matchMemberCameraWithoutNavigating"
  >
    Jump To {{ member.displayName }}
  </MenuItem>
</template>
