<script setup lang="ts">
  import CanvasSurface from '@canvas/surface/CanvasSurface.vue';

  import { computed } from 'vue';

  import ComponentSlots from '../component-slot/ComponentSlots.vue';
  import { useProvidedMagic } from './context.ts';
  import { useDisablePointerEvents } from './internals/useDisablePointerEvents.ts';

  const magic = useProvidedMagic();
  const pointerEvents = useDisablePointerEvents(magic);

  const slotSharedClasses = computed(
    () => `absolute flex flex-col gap-2 ${pointerEvents.value}`,
  );
  const slotCenterClasses = computed(
    () => `${slotSharedClasses.value} top-1/2 -translate-y-1/2`,
  );
  const alignStart = 'items-start';
  const alignEnd = 'items-end';
  const alignCenter = 'items-center';
</script>

<template>
  <!--
    the slot layer spans the viewport so it can clip what leaves it. a panel
    animating in comes from past the edge it is anchored to, and with nothing
    clipping that the page grew scrollbars for the duration of the slide

    it takes no pointer events of its own, since covering the canvas is the
    whole point: the slots claim them individually
  -->
  <div
    v-if="
      !magic.componentSlots.visibility.isHidden.value && !magic.restoring.value
    "
    class="fixed inset-0 overflow-hidden pointer-events-none"
  >
    <ComponentSlots
      :top-left="`${slotSharedClasses} ${alignStart} top-6 left-6`"
      :top-middle="`${slotSharedClasses} ${alignCenter} top-6 left-1/2 -translate-x-1/2`"
      :top-right="`${slotSharedClasses} ${alignEnd} top-6 right-6`"
      :center-left="`${slotCenterClasses} ${alignStart} left-6`"
      :center-right="`${slotCenterClasses} ${alignEnd} right-6`"
      :bottom-left="`${slotSharedClasses} ${alignStart} bottom-6 left-6`"
      :bottom-middle="`${slotSharedClasses} ${alignCenter} bottom-6 left-1/2 -translate-x-1/2`"
      :bottom-right="`${slotSharedClasses} ${alignEnd} bottom-6 right-6`"
    />
  </div>

  <!--
    the canvas stays mounted while state resolves, since tearing it down and back up
    would lose the surface. it is only hidden, so the first frame anyone sees is the
    state this product actually settled on rather than local content a room is about
    to replace
  -->
  <div
    v-show="magic.restoring.value"
    class="fixed inset-0 z-50 bg-gray-100 dark:bg-gray-900"
  />

  <CanvasSurface v-bind="{ ...magic.surface.ref, $attrs }" />
</template>
