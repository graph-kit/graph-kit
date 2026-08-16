<script setup lang="ts">
  import { Primitive, type PrimitiveProps } from 'reka-ui';

  import { computed, useAttrs } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';
  import { preventFocusSteal } from '../../preventFocusSteal.ts';
  import Tooltip from '../tooltip/Tooltip.vue';
  import { disabledClasses, withoutHandlers } from './disabled.ts';
  import { type ButtonVariant, buttonVariants } from './variants.ts';

  defineOptions({ inheritAttrs: false });

  interface Props extends PrimitiveProps {
    variant?: ButtonVariant;
    /**
     * why the button is unavailable, shown in a tooltip. prefer the reason over a bare
     * `true`, which disables the button with no explanation and is only honest when the
     * cause is already obvious on screen.
     */
    disabled?: boolean | string;
  }

  const props = withDefaults(defineProps<Props>(), {
    as: 'button',
    variant: 'solid',
  });

  const base =
    'inline-flex cursor-pointer items-center justify-center gap-1 rounded-md px-3 py-2 text-md font-bold transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const isDisabled = computed(() => !!props.disabled);

  const disabledReason = computed(() =>
    typeof props.disabled === 'string' ? props.disabled : undefined,
  );

  const classes = computed(() => {
    const enabled = cn(base, buttonVariants[props.variant], attrClass.value);
    return isDisabled.value ? disabledClasses(enabled) : enabled;
  });

  const forwardedAttrs = computed(() => ({
    ...(isDisabled.value ? withoutHandlers(attrs) : attrs),
    class: undefined,
  }));

  defineSlots<{
    default: () => unknown;
    start?: () => unknown;
    end?: () => unknown;
  }>();
</script>

<template>
  <!-- aria-disabled rather than the native attribute, which would suppress the very
       pointer and focus events the explanation needs to surface.
       note the trigger owns `data-state` (the tooltip's own open/closed), so styling
       an outer trigger's open state has to key off something else, e.g. aria-expanded -->
  <Tooltip :label="disabledReason">
    <template #trigger>
      <Primitive
        :as="as"
        :as-child="asChild"
        :aria-disabled="isDisabled || undefined"
        v-bind="forwardedAttrs"
        :class="classes"
        @mousedown="preventFocusSteal"
      >
        <slot name="start" />
        <slot />
        <slot name="end" />
      </Primitive>
    </template>
  </Tooltip>
</template>
