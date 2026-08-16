<script setup lang="ts">
  import DropdownSubmenu from '@core/components/DropdownSubmenu';
  import { mdiChevronRight } from '@mdi/js';

  import Button from '../button/Button.vue';
  import Icon from '../icon/Icon.vue';
  import { menuItemClasses, menuPanelClasses } from './classes.ts';

  // the trigger loses hover once the pointer crosses into the submenu, so the open state carries the highlight.
  // keyed off aria-expanded rather than data-state, which Button's own tooltip trigger owns
  const triggerClasses = `${menuItemClasses} aria-expanded:bg-gray-100 dark:aria-expanded:bg-gray-900`;

  defineSlots<{
    default: () => unknown;
    trigger: () => unknown;
  }>();
</script>

<template>
  <DropdownSubmenu :class="menuPanelClasses">
    <template #trigger>
      <Button :class="triggerClasses">
        <slot name="trigger" />
        <template #end>
          <!-- the caret is what marks a row as a submenu, so it belongs to every one of them -->
          <Icon
            class="ml-auto"
            :size="20"
            :path="mdiChevronRight"
          />
        </template>
      </Button>
    </template>
    <slot />
  </DropdownSubmenu>
</template>
