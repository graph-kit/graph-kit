<script setup lang="ts">
  import { mdiArrowRightBold } from '@mdi/js';
  import { RosterEntry } from '@multiplayer/protocol/room';

  import { computed } from 'vue';

  import MenuItem from '../../components/dropdown/MenuItem.vue';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';
  import { requestJump } from '../../multiplayer/useJumpToUser.ts';
  import { useProvidedMagic } from '../../product/context.ts';
  import { assertIsProductId } from '../../product/manifests/isValidProductId.ts';
  import { navigateToProduct } from '../navigation-menu/navigateToProduct.ts';

  interface Props {
    member: RosterEntry;
  }

  const props = defineProps<Props>();

  const magic = useProvidedMagic();
  const { room } = useConnectedMultiplayer();

  const inSameProduct = computed(
    () => props.member.productId === magic.manifest.id,
  );

  const moveCameraToThem = () => {
    const camera =
      room.value.userIdToPresence[props.member.userId]?.cameraState;
    if (!camera) return;
    magic.surface.camera.actions.moveTo(camera);
  };

  const jump = () => {
    if (inSameProduct.value) return moveCameraToThem();

    const productId = props.member.productId;
    assertIsProductId(productId);
    requestJump(props.member.userId);
    navigateToProduct(productId);
  };
</script>

<template>
  <MenuItem
    @click="jump"
    :icon="mdiArrowRightBold"
    :disabled="member.productId === null ? 'Not in an experience yet' : false"
  >
    Jump To {{ member.displayName }}
  </MenuItem>
</template>
