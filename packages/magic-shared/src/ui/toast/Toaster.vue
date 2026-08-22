<script setup lang="ts">
  import CoreToast from '@core/components/Toast';
  import CoreToaster from '@core/components/Toaster';

  import Toast from './Toast.vue';
  import { isCustomToast } from './types.ts';
  import { useToastState } from './useToastState.ts';

  const toast = useToastState();

  const durationMs = (duration: number | 'persistent') =>
    duration === 'persistent' ? Number.POSITIVE_INFINITY : duration;
</script>

<template>
  <CoreToaster>
    <template
      v-for="entry of toast.entries.value"
      :key="entry.id"
    >
      <!--
        the escape hatch. only the chrome is ours: the card holds whatever the caller
        handed over, which owns its own close affordance if it wants one
      -->
      <CoreToast
        v-if="isCustomToast(entry)"
        :open="entry.open"
        :duration="durationMs(entry.duration)"
        @close="toast.dismiss(entry.id)"
      >
        <component
          :is="entry.component"
          v-bind="entry.props"
        />
      </CoreToast>

      <Toast
        v-else
        v-bind="entry"
        :duration="durationMs(entry.duration)"
        @close="toast.dismiss(entry.id)"
      />
    </template>
  </CoreToaster>
</template>
