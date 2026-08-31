<script setup lang="ts">
  import Icon from '../../components/icon/Icon.vue';
  import VStack from '../../components/layout/VStack.vue';
  import { useProvidedShell } from '../../product/context.ts';

  const { helpMenu } = useProvidedShell();

  // the keys sit on the panel's own surface, so they carry their own edge to read as caps
  const capClasses =
    'inline-flex items-center gap-1 rounded border border-gray-400 dark:border-gray-600 bg-gray-200 dark:bg-gray-900 px-2 py-0.5 text-xs font-semibold';
</script>

<template>
  <VStack gap="6">
    <VStack
      v-for="section of helpMenu.sections.value"
      :key="section.category"
      gap="1"
    >
      <h3 class="text-xs font-bold uppercase tracking-wide opacity-60">
        {{ section.category }}
      </h3>
      <div
        v-for="row of section.rows"
        :key="row.name"
        class="flex items-center justify-between gap-4"
      >
        <span class="text-sm">{{ row.name }}</span>
        <div class="flex shrink-0 items-center gap-1">
          <span
            v-for="chip of row.trigger"
            :key="chip.text"
            :class="capClasses"
          >
            <!-- a gesture is a picture and a name, a key is only ever its own name -->
            <Icon
              v-if="chip.icon"
              :path="chip.icon"
              :size="14"
            />
            {{ chip.text }}
          </span>
        </div>
      </div>
    </VStack>
  </VStack>
</template>
