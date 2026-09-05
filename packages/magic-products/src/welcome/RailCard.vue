<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import Icon from '@magic/shared/Icon';
  import Well from '@magic/shared/Well';
  import { ProductCard } from '@magic/shared/product';
  import { productHref } from '@magic/shared/ui/index';
  import { mdiArrowRight } from '@mdi/js';

  import { computed } from 'vue';

  import { useProvidedWelcomeScene } from './useProvidedWelcomeScene.ts';

  const props = defineProps<{ productId: string; card: ProductCard }>();

  const scene = useProvidedWelcomeScene();

  /** the card being read wins over the one the canvas is holding */
  const lit = computed(
    () => (scene.hovered.value ?? scene.active.value) === props.productId,
  );
</script>

<template>
  <Well class="w-72 shrink-0 p-0">
    <Button
      :href="productHref(productId)"
      class="w-full justify-between gap-3 bg-transparent p-3 text-left transition-colors hover:bg-gray-100 dark:bg-transparent dark:hover:bg-gray-900"
      :class="lit ? 'bg-gray-100 dark:bg-gray-900' : ''"
      @pointerenter="scene.hover(productId)"
      @pointerleave="scene.hover(undefined)"
      @focus="scene.hover(productId)"
      @blur="scene.hover(undefined)"
    >
      <h2 class="min-w-0 flex-1 truncate text-lg leading-7 font-bold">
        {{ card.name }}
      </h2>

      <Icon
        :path="mdiArrowRight"
        :size="20"
        class="shrink-0 transition-opacity"
        :class="lit ? 'opacity-100' : 'opacity-0'"
      />
    </Button>
  </Well>
</template>
