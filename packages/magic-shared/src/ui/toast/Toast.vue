<script setup lang="ts">
  import CoreToast from '@core/components/Toast';
  import { type ToastSeverity } from '@core/components/Toast/types';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import { severityIcon } from './severity.ts';
  import { ToastButton } from './types.ts';

  interface Props {
    open: boolean;
    duration: number;
    title: string;
    description?: string;
    severity: ToastSeverity;
    buttons?: ToastButton[];
  }

  defineProps<Props>();

  defineEmits<{ close: [] }>();
</script>

<template>
  <CoreToast
    v-bind="{ open, duration, title, description, severity }"
    class="bg-gray-200 text-gray-900 dark:bg-gray-800 dark:text-white"
    @close="$emit('close')"
  >
    <template #icon>
      <Icon
        :path="severityIcon[severity]"
        :size="20"
      />
    </template>

    <!-- conditional so an empty actions row never takes up the space it would need -->
    <template
      v-if="buttons?.length"
      #actions
    >
      <Button
        v-for="button of buttons"
        :key="button.textContent"
        class="px-2 py-1 text-sm"
        @click="button.onClick"
      >
        {{ button.textContent }}
      </Button>
    </template>
  </CoreToast>
</template>
