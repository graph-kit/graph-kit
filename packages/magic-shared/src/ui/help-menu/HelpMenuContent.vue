<script setup lang="ts">
  import { isTypingTarget } from '@core/utils/keyboard';

  import { onMounted, onUnmounted } from 'vue';

  import Icon from '../../components/icon/Icon.vue';
  import VStack from '../../components/layout/VStack.vue';
  import { useProvidedShell } from '../../product/context.ts';
  import FeedbackBanner from './FeedbackBanner.vue';
  import { HELP_MENU_KEY } from './useHelpMenuState.ts';

  const { helpMenu } = useProvidedShell();

  // the shell's shortcut stands down inside a dialog, so the menu closes itself
  const closeOnHelpKey = (event: KeyboardEvent) => {
    if (isTypingTarget(event)) return;
    if (event.key.toLowerCase() !== HELP_MENU_KEY) return;
    helpMenu.setOpen(false);
  };

  onMounted(() => window.addEventListener('keydown', closeOnHelpKey));
  onUnmounted(() => window.removeEventListener('keydown', closeOnHelpKey));

  const capClasses =
    'inline-flex items-center gap-1 rounded border border-gray-400 dark:border-gray-600 bg-gray-200 dark:bg-gray-900 px-2 py-0.5 text-xs font-semibold';
</script>

<template>
  <VStack>
    <FeedbackBanner />
    <VStack
      v-for="section of helpMenu.sections.value"
      :key="section.category"
      gap="1"
    >
      <h3 class="opacity-80 font-bold tracking-wide">
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
