<script setup lang="ts">
  import { mdiAccountCog } from '@mdi/js';
  import { RosterEntry } from '@multiplayer/protocol/room';
  import {
    ASSIGNABLE_TIERS,
    AssignableTier,
  } from '@multiplayer/protocol/tiers';

  import DropdownSubmenu from '../../components/dropdown/DropdownSubmenu.vue';
  import MenuItem from '../../components/dropdown/MenuItem.vue';
  import Icon from '../../components/icon/Icon.vue';
  import VStack from '../../components/layout/VStack.vue';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';

  interface Props {
    member: RosterEntry;
  }

  const props = defineProps<Props>();

  const { room } = useConnectedMultiplayer();

  const setTier = (tier: AssignableTier) =>
    room.value.controls.setTier(props.member.userId, tier);
</script>

<template>
  <DropdownSubmenu side="left">
    <template #trigger>
      <Icon :path="mdiAccountCog" />
      Change Role
    </template>
    <VStack gap="0">
      <MenuItem
        v-for="tier in ASSIGNABLE_TIERS"
        :key="tier"
        @click="setTier(tier)"
      >
        {{ tier }}
      </MenuItem>
    </VStack>
  </DropdownSubmenu>
</template>
