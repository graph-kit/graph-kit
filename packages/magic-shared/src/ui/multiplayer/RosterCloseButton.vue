<script setup lang="ts">
  import { mdiClose } from '@mdi/js';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import Tooltip from '../../components/tooltip/Tooltip.vue';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';

  const { multiplayer } = useConnectedMultiplayer();
</script>

<template>
  <div>
    <Tooltip label="Close Panel">
      <template #trigger>
        <Button
          @click="multiplayer.ui.rosterPanel.hide"
          class="absolute top-2 right-2 hover:dark:bg-red-600 p-1"
        >
          <Icon
            :path="mdiClose"
            :size="20"
          />
        </Button>
      </template>
    </Tooltip>
  </div>
</template>
