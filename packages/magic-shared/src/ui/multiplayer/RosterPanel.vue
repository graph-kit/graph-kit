<script setup lang="ts">
  import { mdiCloseNetworkOutline, mdiExitRun } from '@mdi/js';

  import { computed } from 'vue';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';
  import CloseButton from './CloseButton.vue';
  import CopySessionCode from './CopySessionCode.vue';
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
      <HStack class="self-center">
        <!-- <Icon
          :size="30"
          :path="mdiAccountMultiple"
        /> -->
        <span class="text-2xl"> Collaborators ({{ roster.length }}) </span>
      </HStack>

      <CloseButton @closed="multiplayer.ui.rosterPanel.hide" />

      <VStack
        gap="0"
        class="text-lg max-h-72 overflow-auto"
      >
        <RosterCollaborator
          v-for="(member, userId) in roster"
          :key="userId"
          :member="member"
        />
      </VStack>

      <div class="w-full h-px bg-black/20 dark:bg-white/20"></div>

      <CopySessionCode />

      <Button
        class="dark:bg-red-500 bg-red-500 hover:bg-red-600 dark:hover:bg-red-600 active:bg-red-600 text-white"
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
