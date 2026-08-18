<script setup lang="ts">
  import { mdiCloseNetworkOutline, mdiExitRun } from '@mdi/js';

  import { computed } from 'vue';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';
  import CopySessionCode from './CopySessionCode.vue';
  import RosterCloseButton from './RosterCloseButton.vue';
  import RosterCollaborator from './RosterCollaborator.vue';

  const { room, multiplayer } = useConnectedMultiplayer();

  const roster = computed(() => Object.values(room.value.userIdToRosterEntry));

  const departure = computed(() => {
    return room.value.me.isHost
      ? { text: 'Disband Session', icon: mdiCloseNetworkOutline }
      : { text: 'Leave Session', icon: mdiExitRun };
  });
</script>

<template>
  <Well class="w-80 p-3">
    <VStack class="font-bold">
      <div class="text-2xl text-center">
        Collaborators ({{ roster.length }})
      </div>

      <RosterCloseButton />

      <VStack
        gap="0"
        class="text-lg"
      >
        <RosterCollaborator
          v-for="(member, userId) in roster"
          :key="userId"
          :member="member"
        />
      </VStack>

      <div class="w-full h-px bg-white/20"></div>

      <CopySessionCode />

      <Button
        class="dark:bg-red-500 bg-red-500 hover:bg-red-600 dark:hover:bg-red-600 text-white"
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
