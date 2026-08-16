<script setup lang="ts">
  import { mdiDotsVertical } from '@mdi/js';
  import { RosterEntry } from '@multiplayer/protocol/room';

  import Dropdown from '../../components/dropdown/Dropdown.vue';
  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import DisplayNameEdit from './DisplayNameEdit.vue';
  import TierBadge from './TierBadge.vue';
  import TierEdit from './TierEdit.vue';

  interface Props {
    member: RosterEntry;
  }

  defineProps<Props>();
</script>

<template>
  <Dropdown side="left">
    <template #trigger>
      <HStack
        class="w-full hover:bg-gray-900 py-1 px-2 cursor-pointer justify-between rounded-md"
      >
        <span>{{ member.displayName }}</span>
        <HStack>
          <TierBadge :tier="member.tier" />
          <Icon
            :path="mdiDotsVertical"
            :size="22"
          />
        </HStack>
      </HStack>
    </template>
    <VStack gap="0">
      <DisplayNameEdit :member="member" />
      <TierEdit :member="member" />
    </VStack>
  </Dropdown>
</template>
