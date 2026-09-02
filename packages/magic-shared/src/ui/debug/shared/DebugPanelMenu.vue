<script setup lang="ts">
  import Dropdown from '../../../components/dropdown/Dropdown.vue';
  import VStack from '../../../components/layout/VStack.vue';
  import Well from '../../../components/layout/Well.vue';
  import DebugHeading from './DebugHeading.vue';
  import { PANEL, PANEL_TYPE } from './classes.ts';

  defineOptions({ inheritAttrs: false });

  defineProps<{ title: string }>();
</script>

<template>
  <!-- the corner it saves is a right hand one, so the menu hangs back into the screen -->
  <Dropdown
    side="bottom"
    align="end"
  >
    <template #trigger>
      <!-- full width, so the heading is a row of the slot's stack rather than a tag beside it -->
      <button
        v-bind="$attrs"
        type="button"
        class="w-full cursor-pointer"
      >
        <Well
          :class="[
            PANEL_TYPE,
            'w-full hover:bg-gray-300 dark:hover:bg-gray-700',
          ]"
        >
          <DebugHeading :title="title">
            <template #badge><slot name="badge" /></template>
          </DebugHeading>
        </Well>
      </button>
    </template>

    <!-- the menu is the panel's own surface, so the panel is laid out here without a second one -->
    <VStack
      gap="3"
      :class="PANEL"
    >
      <DebugHeading :title="title">
        <template #badge><slot name="badge" /></template>
      </DebugHeading>
      <slot />
    </VStack>
  </Dropdown>
</template>
