<script setup lang="ts">
  import {
    TooltipContent,
    TooltipPortal,
    TooltipProvider,
    TooltipRoot,
    TooltipTrigger,
  } from 'reka-ui';

  import { computed, normalizeClass, useAttrs } from 'vue';

  import { cn } from '../../cn.ts';
  import { type TooltipProps } from './types.ts';

  defineOptions({ inheritAttrs: false });

  const props = withDefaults(defineProps<TooltipProps>(), {
    side: 'top',
    delay: 0,
  });

  /** stays true across the trigger, the tooltip, and the gap between them, unlike trigger mouseenter/mouseleave */
  const open = defineModel<boolean>('open');

  const attrs = useAttrs();

  const hasContent = computed(() => !!props.label);

  const classes = computed(() =>
    cn(
      'z-50 max-w-xs rounded-md bg-neutral-900 px-3 py-1.5 text-sm text-white shadow-md',
      'transition-[opacity,scale] duration-200 ease-[cubic-bezier(0.34,1.8,0.64,1)]',
      'starting:opacity-0 starting:scale-75',
      normalizeClass(props.class),
    ),
  );
</script>

<template>
  <TooltipProvider :delay-duration="delay">
    <!-- with no content there is no grace area to close on pointer exit, so leaving the trigger has to -->
    <!-- closing on trigger click would punch a hole in `open` while the pointer is still on the trigger -->
    <!-- focus handed back by something closing, a menu returning it to its trigger or a
         tab switch, is not someone asking what the control does. keyboard focus still is -->
    <TooltipRoot
      v-model:open="open"
      :disable-hoverable-content="!hasContent"
      disable-closing-trigger
      ignore-non-keyboard-focus
    >
      <TooltipTrigger as-child>
        <slot name="trigger" />
      </TooltipTrigger>
      <TooltipPortal>
        <TooltipContent
          v-if="hasContent"
          :aria-label="label"
          :side="side"
          :side-offset="6"
          v-bind="attrs"
          :class="classes"
        >
          <slot>{{ label }}</slot>
        </TooltipContent>
      </TooltipPortal>
    </TooltipRoot>
  </TooltipProvider>
</template>
