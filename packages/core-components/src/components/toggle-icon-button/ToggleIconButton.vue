<script setup lang="ts">
  import { Toggle } from 'reka-ui';

  import { computed, useAttrs } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';
  import { preventFocusSteal } from '../../preventFocusSteal.ts';
  import { disabledClasses, withoutHandlers } from '../button/disabled.ts';
  import { type ButtonVariant, buttonVariants } from '../button/variants.ts';
  import Icon from '../icon/Icon.vue';
  import Tooltip from '../tooltip/Tooltip.vue';
  import { type TooltipOptions } from '../tooltip/types.ts';

  defineOptions({ inheritAttrs: false });

  interface Props extends Omit<TooltipOptions, 'class'> {
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
    variant: 'solid',
    size: 20,
  });

  // works whether the consumer passes v-model or not: bound if they do,
  // otherwise a plain local ref that just holds its own state.
  const pressed = defineModel<boolean>();

  const base =
    'inline-flex cursor-pointer items-center justify-center rounded-md p-2 transition-colors active:scale-[0.98] focus-visible:outline-none';

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

  // Toggle's own `disabled` would take the native attribute route and cost the
  // tooltip its events, so the press is refused here instead
  const onPressedChange = (next: boolean) => {
    if (isDisabled.value) return;
    pressed.value = next;
  };
</script>

<template>
  <Tooltip
    :label="disabledReason ?? label"
    :side="side"
    :delay="delay"
  >
    <template #trigger>
      <Toggle
        :model-value="pressed"
        :aria-label="label"
        :aria-disabled="isDisabled || undefined"
        v-bind="forwardedAttrs"
        :class="classes"
        @update:model-value="onPressedChange"
        @mousedown="preventFocusSteal"
      >
        <Icon
          :path="path"
          :size="size"
        />
      </Toggle>
    </template>
  </Tooltip>
</template>
