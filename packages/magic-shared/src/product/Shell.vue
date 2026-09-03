<script setup lang="ts">
  import CanvasSurface from '@canvas/surface/CanvasSurface.vue';

  import { computed } from 'vue';

  import ComponentSlots from '../component-slot/ComponentSlots.vue';
  import ShellDialog from '../ui/dialog/ShellDialog.vue';
  import { useProvidedShell } from './context.ts';
  import { useDisablePointerEvents } from './internals/useDisablePointerEvents.ts';

  const shell = useProvidedShell();
  const pointerEvents = useDisablePointerEvents(shell);

  const slotSharedClasses = computed(
    () => `absolute flex gap-2 ${pointerEvents.value}`,
  );
  const slotStackClasses = computed(
    () => `${slotSharedClasses.value} flex-col`,
  );
  const slotCenterClasses = computed(
    () => `${slotSharedClasses.value} flex-row top-1/2 -translate-y-1/2`,
  );
  const alignStart = 'items-start';
  const alignEnd = 'items-end';
  const alignCenter = 'items-center';
</script>

<template>
  <div
    v-if="!shell.componentSlots.visibility.isHidden.value"
    class="fixed inset-0 overflow-hidden pointer-events-none"
  >
    <ComponentSlots
      :top-left="`${slotStackClasses} ${alignStart} top-6 left-6`"
      :top-middle="`${slotStackClasses} ${alignCenter} top-6 left-1/2 -translate-x-1/2`"
      :top-right="`${slotStackClasses} ${alignEnd} top-6 right-6`"
      :center-left="`${slotCenterClasses} ${alignCenter} left-6`"
      :center-right="`${slotCenterClasses} ${alignCenter} right-6`"
      :bottom-left="`${slotStackClasses} ${alignStart} bottom-6 left-6`"
      :bottom-middle="`${slotStackClasses} ${alignCenter} bottom-6 left-1/2 -translate-x-1/2`"
      :bottom-right="`${slotStackClasses} ${alignEnd} bottom-6 right-6`"
    />
  </div>

  <CanvasSurface v-bind="{ ...shell.surface.ref, $attrs }" />

  <ShellDialog />
</template>
