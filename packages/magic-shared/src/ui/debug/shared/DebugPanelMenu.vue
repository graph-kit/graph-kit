<script setup lang="ts">
  import Dropdown from '../../../components/dropdown/Dropdown.vue';
  import VStack from '../../../components/layout/VStack.vue';
  import Well from '../../../components/layout/Well.vue';
  import DebugHeading from './DebugHeading.vue';
  import { PANEL, PANEL_TYPE } from './classes.ts';

  /** the inset the slot layer holds every panel to, matched so the menu clears it too */
  const SLOT_INSET_PX = 24;

  /*
    reka measures the room left between the trigger and the edge it opened towards. a
    panel taller than that scrolls inside the menu rather than running off the screen
  */
  const AVAILABLE_HEIGHT =
    'panel-scroll max-h-[var(--reka-dropdown-menu-content-available-height)] overflow-y-auto';

  defineOptions({ inheritAttrs: false });

  defineProps<{ title: string }>();
</script>

<template>
  <!--
    a collapsed heading is worth the room in a corner already full of panels, which is
    where it opens from: upwards and back into the screen, padded like the panel it
    stands in for rather than like a menu of items
  -->
  <Dropdown
    align="end"
    :collision-padding="SLOT_INSET_PX"
    class="p-2"
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
      :class="[PANEL, AVAILABLE_HEIGHT]"
    >
      <DebugHeading :title="title">
        <template #badge><slot name="badge" /></template>
      </DebugHeading>
      <slot />
    </VStack>
  </Dropdown>
</template>

<style scoped>
  .panel-scroll {
    scrollbar-width: none;
  }

  .panel-scroll::-webkit-scrollbar {
    display: none;
  }
</style>
