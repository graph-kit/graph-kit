<script setup lang="ts">
  import { Primitive, type PrimitiveProps } from 'reka-ui';

  import { computed, useAttrs } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';
  import { preventFocusSteal } from '../../preventFocusSteal.ts';
  import { disabledClasses, withoutHandlers } from '../button/disabled.ts';
  import { type ButtonVariant, buttonVariants } from '../button/variants.ts';
  import Icon from '../icon/Icon.vue';
  import Tooltip from '../tooltip/Tooltip.vue';

  defineOptions({ inheritAttrs: false });

  interface Props extends PrimitiveProps {
    // the icon to render, e.g. an mdi path from '@mdi/js'
    path: string;
    /**
     * required, plain-text accessible name for this button.
     * there's no visible text content, so this is the only thing
     * screen readers have to announce what the button does.
     */
    label: string;
    variant?: ButtonVariant;
    size?: number;
    /**
     * why the button is unavailable, which takes over the tooltip, since why it's off
     * is the more useful thing to read once it is. prefer the reason over a bare `true`,
     * which disables the button with no explanation.
     */
    disabled?: boolean | string;
  }

  const props = withDefaults(defineProps<Props>(), {
    as: 'button',
    variant: 'solid',
    size: 20,
  });

  const base =
    'inline-flex cursor-pointer items-center justify-center rounded-md p-2 transition-colors active:scale-[0.98] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2';

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const isDisabled = computed(() => !!props.disabled);

  const disabledReason = computed(() =>
    typeof props.disabled === 'string' ? props.disabled : undefined,
  );

  // a menu handed this button its trigger props, so it arrives as a boolean rather
  // than the string the DOM would hold
  const isExpanded = computed(
    () => attrs['aria-expanded'] === true || attrs['aria-expanded'] === 'true',
  );

  // whatever this button expanded says more about it than the tooltip can, and
  // the accessible name is on the button itself, so nothing is lost by standing down
  const tooltipLabel = computed(() =>
    isExpanded.value ? undefined : (disabledReason.value ?? props.label),
  );

  const classes = computed(() => {
    const enabled = cn(base, buttonVariants[props.variant], attrClass.value);
    return isDisabled.value ? disabledClasses(enabled) : enabled;
  });

  const forwardedAttrs = computed(() => ({
    ...(isDisabled.value ? withoutHandlers(attrs) : attrs),
    class: undefined,
  }));
</script>

<template>
  <Tooltip :label="tooltipLabel">
    <template #trigger>
      <Primitive
        :as="as"
        :as-child="asChild"
        :aria-label="label"
        :aria-disabled="isDisabled || undefined"
        v-bind="forwardedAttrs"
        :class="classes"
        @mousedown="preventFocusSteal"
      >
        <Icon
          :path="path"
          :size="size"
        />
      </Primitive>
    </template>
  </Tooltip>
</template>
