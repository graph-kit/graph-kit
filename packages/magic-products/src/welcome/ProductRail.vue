<script setup lang="ts">
  import Well from '@magic/shared/Well';
  import { useElementBounding } from '@vueuse/core';

  import { useTemplateRef, watchEffect } from 'vue';

  import RailCard from './RailCard.vue';
  import { exampleCards } from './examples.ts';
  import { useProvidedWelcomeScene } from './useWelcomeScene.ts';

  /** breathing room between the rail and the scene centered beside it */
  const CANVAS_GAP_PX = 24;

  const scene = useProvidedWelcomeScene();

  const rail = useTemplateRef('rail');
  const { right } = useElementBounding(rail);

  // rounded, since the sub pixel churn a resize observer reports would otherwise read as
  // the rail changing size
  watchEffect(() => {
    scene.reservedLeftPx.value = right.value
      ? Math.round(right.value + CANVAS_GAP_PX)
      : 0;
  });
</script>

<template>
  <Well
    ref="rail"
    class="flex w-fit flex-col gap-2 select-none"
  >
    <RailCard
      v-for="{ id, card } in exampleCards"
      :key="id"
      v-bind="{ id, card }"
    />
  </Well>
</template>
