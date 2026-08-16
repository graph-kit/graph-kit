<script setup lang="ts">
  import { mdiCloseNetworkOutline, mdiExitRun } from '@mdi/js';

  import { computed } from 'vue';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';
  import RosterCloseButton from './RosterCloseButton.vue';
  import TierBadge from './TierBadge.vue';

  const { room, multiplayer } = useConnectedMultiplayer();

  const roster = computed(() => Object.values(room.value.userIdToRosterEntry));

  const departure = computed(() => {
    return room.value.me.isHost
      ? { text: 'Disband Session', icon: mdiCloseNetworkOutline }
      : { text: 'Leave Session', icon: mdiExitRun };
  });
</script>

<template>
  <Well>
    <VStack class="font-bold">
      <div class="text-2xl pr-10 pb-2">Collaborators ({{ roster.length }})</div>

      <RosterCloseButton />

      <VStack class="text-lg">
        <HStack
          v-for="(member, userId) in roster"
          :key="userId"
          :gap="2"
        >
          <TierBadge :tier="member.tier" />
          <span>{{ member.displayName }}</span>
        </HStack>
      </VStack>

      <Button
        class="dark:bg-red-500 bg-red-500 dark:hover:bg-red-600 text-white hover:bg-red-600 mt-3"
        @click="multiplayer.room.leave"
      >
        <template #start>
          <Icon :path="departure.icon" />
        </template>
        {{ departure.text }}
      </Button>
    </VStack>
  </Well>
</template>
