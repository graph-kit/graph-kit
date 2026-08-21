<script setup lang="ts">
  import { mdiClose } from '@mdi/js';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import Tooltip from '../../components/tooltip/Tooltip.vue';

  const emit = defineEmits<{
    closed: [];
  }>();
</script>

<template>
  <div>
    <Tooltip label="Close">
      <template #trigger>
        <Button
          @click="emit('closed')"
          class="absolute top-2 right-2 hover:dark:bg-red-600 hover:bg-red-600 hover:text-white p-1"
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
