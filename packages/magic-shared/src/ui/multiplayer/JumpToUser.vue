<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import { mdiArrowRightBold, mdiCrosshairsGps } from '@mdi/js';
  import { RosterEntry } from '@multiplayer/protocol/room';

  import { computed } from 'vue';

  import MenuItem from '../../components/dropdown/MenuItem.vue';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';
  import { requestJump } from '../../multiplayer/useJumpToUser.ts';
  import { useProvidedMagic } from '../../product/context.ts';
  import { ProductId, manifests } from '../../product/manifests/index.ts';
  import { navigateToProduct } from '../navigation-menu/navigateToProduct.ts';

  interface Props {
    member: RosterEntry;
  }

  const props = defineProps<Props>();

  const magic = useProvidedMagic();
  const { room } = useConnectedMultiplayer();

  // the roster says which experience they are in, presence says where they are looking
  // within it, and only the second one waits on them to move
  const isHere = computed(() => props.member.productId === magic.manifest.id);

  const moveCameraToThem = () => {
    const camera =
      room.value.userIdToPresence[props.member.userId]?.cameraState;
    if (!camera) return;
    magic.surface.camera.actions.moveTo(camera);
  };

  const jump = () => {
    if (isHere.value) return moveCameraToThem();

    const productId = props.member.productId;
    if (productId === null) return;

    // the camera half happens on the other side, once that experience has a surface
    requestJump(props.member.userId);
    navigateToProduct(
      nullThrows(
        manifests[productId as ProductId],
        `jumped at a user in an unknown experience "${productId}"`,
      ),
    );
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
