<script setup lang="ts">
  import { mdiTransitTransfer } from '@mdi/js';
  import { RosterEntry } from '@multiplayer/protocol/room';

  import DropdownSubmenu from '../../components/dropdown/DropdownSubmenu.vue';
  import MenuItem from '../../components/dropdown/MenuItem.vue';
  import Icon from '../../components/icon/Icon.vue';
  import VStack from '../../components/layout/VStack.vue';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';
  import { products } from '../../product/manifests/index.ts';

  interface Props {
    member: RosterEntry;
  }

  const props = defineProps<Props>();

  const { room } = useConnectedMultiplayer();

  // a product that opted out of multiplayer has no room state to land in
  const destinations = products.filter((product) => product.multiplayer);

  const moveUser = (productId: string) =>
    room.value.controls.moveUser(props.member.userId, productId);
</script>

<template>
  <DropdownSubmenu side="left">
    <template #trigger>
      <Icon :path="mdiTransitTransfer" />
      Move To
    </template>
    <VStack gap="0">
      <MenuItem
        v-for="destination in destinations"
        :key="destination.id"
        @click="moveUser(destination.id)"
        :disabled="destination.id === member.productId ? 'Already here' : false"
      >
        {{ destination.name }}
      </MenuItem>
    </VStack>
  </DropdownSubmenu>
</template>
