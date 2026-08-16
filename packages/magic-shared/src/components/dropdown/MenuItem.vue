<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { useAttrClass } from '@core/components/composables/useAttrClass';

  import { computed, useAttrs } from 'vue';

  import Button from '../button/Button.vue';
  import Icon from '../icon/Icon.vue';
  import DropdownItem from './DropdownItem.vue';
  import { menuItemClasses } from './classes.ts';

  // as-child collapses the item and the button into one element, and the child's own
  // class wins that merge, so the call site's class is merged in here or it is lost
  defineOptions({ inheritAttrs: false });

  interface Props {
    /** an icon path string from '@mdi/js', e.g. mdiHome */
    icon?: string;
    disabled?: boolean | string;
  }

  defineProps<Props>();

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const classes = computed(() => cn(menuItemClasses, attrClass.value));

  defineSlots<{
    default: () => unknown;
    end?: () => unknown;
  }>();
</script>

<template>
  <DropdownItem v-bind="{ ...attrs, class: undefined }">
    <Button
      :class="classes"
      :disabled="disabled"
    >
      <template #start>
        <Icon
          v-if="icon"
          :path="icon"
        />
      </template>
      <slot />
      <template #end><slot name="end" /></template>
    </Button>
  </DropdownItem>
</template>
