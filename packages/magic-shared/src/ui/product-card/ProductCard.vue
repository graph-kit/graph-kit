<script setup lang="ts">
  import { computed } from 'vue';

  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import { useProvidedMagic } from '../../product/context.ts';
  import { MagicProductCard } from '../../product/manifests/types.ts';

  const props = defineProps<{ productId: string; card: MagicProductCard }>();

  const magic = useProvidedMagic();

  const thumbnail = computed(
    () =>
      `/product-thumbnails/${magic.appearance.state.value}/${props.productId}.png`,
  );
</script>

<template>
  <HStack class="w-100 items-start gap-4">
    <!-- shrink-0 or the box collapses until load, since a flex item's minimum size follows its intrinsic width -->
    <img
      :src="thumbnail"
      :alt="card.name"
      width="80"
      height="80"
      class="size-24 shrink-0 rounded-md object-cover"
    />
    <VStack class="gap-1 text-left">
      <h1 class="text-lg font-bold">{{ card.name }}</h1>
      <p class="text-sm font-light text-gray-800 dark:text-gray-300">
        {{ card.description }}
      </p>
    </VStack>
  </HStack>
</template>
