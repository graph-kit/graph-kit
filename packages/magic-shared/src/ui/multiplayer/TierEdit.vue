<script setup lang="ts">
  import { mdiAccountCog, mdiInformationOutline } from '@mdi/js';
  import { RosterEntry } from '@multiplayer/protocol/room';
  import { AssignableTier, Tier } from '@multiplayer/protocol/tiers';

  import { computed } from 'vue';

  import DropdownSubmenu from '../../components/dropdown/DropdownSubmenu.vue';
  import MenuItem from '../../components/dropdown/MenuItem.vue';
  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Tooltip from '../../components/tooltip/Tooltip.vue';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';
  import TierBadge from './TierBadge.vue';
  import { assignableTiersFor } from './tier.ts';

  interface Props {
    member: RosterEntry;
  }

  const props = defineProps<Props>();

  const { room } = useConnectedMultiplayer();

  const tiers = computed(() =>
    assignableTiersFor(room.value.me.tier, props.member.tier),
  );

  const setTier = (tier: AssignableTier) =>
    room.value.controls.setTier(props.member.userId, tier);

  const tierInfo: Record<Tier, string> = {
    host: 'Host opened the session. Can do anything, cannot be reassigned or removed, and ends the session for everyone on leaving.',
    admin:
      'Admins can edit, move anyone between experiences, and reassign or remove anyone ranked below them, up to and including making them an admin. Only the host can change an admin.',
    write: 'Writers can edit, but cannot move, reassign or remove anyone.',
    read: 'Readers follow along and can select and pan, but cannot edit anything.',
  };
</script>

<template>
  <DropdownSubmenu side="left">
    <template #trigger>
      <Icon :path="mdiAccountCog" />
      Change Role
    </template>
    <VStack gap="0">
      <MenuItem
        v-for="tier in tiers"
        :key="tier"
        @click="setTier(tier)"
      >
        <HStack class="w-full justify-between">
          <HStack>
            <span>Assign</span>
            <TierBadge :tier="tier" />
          </HStack>
          <Tooltip
            :label="tierInfo[tier]"
            side="left"
          >
            <template #trigger>
              <Icon :path="mdiInformationOutline" />
            </template>
          </Tooltip>
        </HStack>
      </MenuItem>
    </VStack>
  </DropdownSubmenu>
</template>
