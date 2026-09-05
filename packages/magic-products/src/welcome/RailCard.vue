<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import Icon from '@magic/shared/Icon';
  import Well from '@magic/shared/Well';
  import { productHref } from '@magic/shared/ui/index';
  import { mdiArrowRight } from '@mdi/js';

  import { computed } from 'vue';

  import { ExampleCard } from './examples.ts';
  import { useProvidedWelcomeScene } from './useWelcomeScene.ts';

  const props = defineProps<ExampleCard>();

  const scene = useProvidedWelcomeScene();

  const showing = computed(() => scene.showing.value === props.id);
</script>

<template>
  <Well class="w-72 shrink-0 p-0">
    <Button
      :href="productHref(id)"
      class="w-full justify-between gap-3 bg-transparent p-3 text-left transition-colors hover:bg-gray-100 dark:bg-transparent dark:hover:bg-gray-900"
      @pointerenter="scene.show(id)"
      @focus="scene.show(id)"
    >
      <h2 class="min-w-0 flex-1 truncate text-lg leading-7 font-bold">
        {{ card.name }}
      </h2>

      <Icon
        :path="mdiArrowRight"
        :size="20"
        class="shrink-0 transition-opacity"
        :class="showing ? 'opacity-100' : 'opacity-0'"
      />
    </Button>
  </Well>
</template>
