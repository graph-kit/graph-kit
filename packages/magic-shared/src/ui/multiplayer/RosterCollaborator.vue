<script setup lang="ts">
  import { mdiDotsVertical } from '@mdi/js';
  import { RosterEntry } from '@multiplayer/protocol/room';
  import {
    ROOM_COMMAND_FLOOR,
    meetsFloor,
    rankOf,
  } from '@multiplayer/protocol/tiers';

  import { computed } from 'vue';

  import Dropdown from '../../components/dropdown/Dropdown.vue';
  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';
  import DisplayNameEdit from './DisplayNameEdit.vue';
  import KickUser from './KickUser.vue';
  import MeBadge from './MeBadge.vue';
  import MoveUser from './MoveUser.vue';
  import TierBadge from './TierBadge.vue';
  import TierEdit from './TierEdit.vue';

  interface Props {
    member: RosterEntry;
  }

  const { room } = useConnectedMultiplayer();

  const props = defineProps<Props>();

  const isMe = computed(() => props.member.userId === room.value.me.id);

  const menuItems = computed(() =>
    [
      { component: DisplayNameEdit, predicate: isMe.value },
      { component: TierEdit, predicate: room.value.me.isHost && !isMe.value },
      {
        component: MoveUser,
        predicate:
          meetsFloor(room.value.me.tier, ROOM_COMMAND_FLOOR) && !isMe.value,
      },
      {
        component: KickUser,
        predicate: rankOf(room.value.me.tier) > rankOf(props.member.tier),
      },
    ].filter(({ predicate }) => predicate),
  );
</script>

<template>
  <HStack
    v-if="menuItems.length === 0"
    class="w-full py-1 px-2 justify-between rounded-md"
  >
    <span>{{ member.displayName }}</span>
    <HStack>
      <MeBadge v-if="isMe" />
      <TierBadge :tier="member.tier" />
    </HStack>
  </HStack>
  <Dropdown
    v-else
    side="left"
  >
    <template #trigger>
      <HStack
        class="w-full hover:bg-gray-900 py-1 px-2 cursor-pointer justify-between rounded-md"
      >
        <span>{{ member.displayName }}</span>
        <HStack>
          <MeBadge v-if="isMe" />
          <TierBadge :tier="member.tier" />
          <Icon
            v-if="menuItems.length > 0"
            :path="mdiDotsVertical"
            :size="22"
          />
        </HStack>
      </HStack>
    </template>
    <VStack gap="0">
      <component
        v-for="{ component } in menuItems"
        :key="component.__name"
        :is="component"
        :member="member"
      />
    </VStack>
  </Dropdown>
</template>
