<script setup lang="ts">
  import { mdiAccountArrowRight } from '@mdi/js';
  import { RosterEntry } from '@multiplayer/protocol/room';

  import MenuItem from '../../components/dropdown/MenuItem.vue';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';

  interface Props {
    member: RosterEntry;
  }

  const props = defineProps<Props>();

  const { room } = useConnectedMultiplayer();

  const kickUser = () => room.value.controls.kickUser(props.member.userId);
</script>

<template>
  <MenuItem
    @click="kickUser"
    :icon="mdiAccountArrowRight"
    class="hover:bg-red-500 dark:hover:bg-red-500 hover:text-white"
  >
    Kick From Session
  </MenuItem>
</template>
