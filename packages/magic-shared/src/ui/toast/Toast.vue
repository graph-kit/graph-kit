<script setup lang="ts">
  import CoreToast from '@core/components/Toast';
  import { type ToastSeverity } from '@core/components/Toast/types';
  import { mdiClose } from '@mdi/js';

  import Button from '../../components/button/Button.vue';
  import IconButton from '../../components/icon-button/IconButton.vue';
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
        :size="28"
      />
    </template>

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

    <template #close>
      <IconButton
        :path="mdiClose"
        :size="18"
        label="Close"
        class="bg-transparent p-1 hover:bg-red-600 hover:text-white dark:bg-transparent dark:hover:bg-red-600 dark:hover:text-white"
      />
    </template>
  </CoreToast>
</template>
