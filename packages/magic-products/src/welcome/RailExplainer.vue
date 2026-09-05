<script setup lang="ts">
  import { ExplainerText } from '@magic/shared/explainer';
  import { manifests } from '@magic/shared/product';

  import { computed } from 'vue';

  import { useProvidedWelcomeScene } from './useWelcomeScene.ts';

  const scene = useProvidedWelcomeScene();

  const description = computed(
    () => manifests[scene.showing.value].navigation.card.description,
  );
</script>

<template>
  <div class="max-w-3xl pb-8 select-none">
    <ExplainerText :explainer="{ content: description }" />
  </div>
</template>
