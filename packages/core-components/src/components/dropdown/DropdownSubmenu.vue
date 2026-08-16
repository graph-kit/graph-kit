<script setup lang="ts">
  import {
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
  } from 'reka-ui';

  import { computed, useAttrs } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';
  import { dropdownContentClasses } from './classes.ts';

  defineOptions({ inheritAttrs: false });

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const classes = computed(() => cn(dropdownContentClasses, attrClass.value));

  defineSlots<{
    default: () => unknown;
    trigger: () => unknown;
  }>();
</script>

<template>
  <!--
    reka places the panel on whichever side has room and opens it on hover, keys
    and click, so the submenu takes no side or trigger props of its own.
  -->
  <DropdownMenuSub>
    <DropdownMenuSubTrigger as-child>
      <slot name="trigger" />
    </DropdownMenuSubTrigger>
    <DropdownMenuPortal>
      <DropdownMenuSubContent
        :side-offset="6"
        v-bind="{ ...attrs, class: undefined }"
        :class="classes"
      >
        <slot />
      </DropdownMenuSubContent>
    </DropdownMenuPortal>
  </DropdownMenuSub>
</template>
