<script setup lang="ts">
  import { ToastClose, ToastDescription, ToastRoot, ToastTitle } from 'reka-ui';

  import { computed, useAttrs, useSlots } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';
  import { type ToastSeverity } from './types.ts';
  import { toastAccents, toastIconColors } from './variants.ts';

  defineOptions({ inheritAttrs: false });

  interface Props {
    /**
     * false starts the exit animation. the card stays mounted while it plays, so
     * whoever owns this has to drop the toast once it has finished
     */
    open: boolean;
    /** milliseconds until it closes itself. Infinity keeps it up until something takes it down */
    duration: number;
    title?: string;
    description?: string;
    severity?: ToastSeverity;
  }

  const props = defineProps<Props>();

  const emit = defineEmits<{
    /** its timer ran out, it was swiped away, or the close affordance was used */
    close: [];
  }>();

  const slots = useSlots();

  /** a filled default slot is the escape hatch: it is the toast, not something inside one */
  const isCustom = computed(() => !!slots.default);

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  /** everything the toast needs to work regardless of who paints it */
  const base = 'core-toast pointer-events-auto w-80';

  const card =
    'flex items-start gap-3 rounded-md bg-neutral-900 p-3 text-white shadow-lg';

  const classes = computed(() =>
    cn(
      base,
      !isCustom.value && card,
      !isCustom.value && props.severity && toastAccents[props.severity],
      attrClass.value,
    ),
  );
</script>

<template>
  <!--
    open is bound rather than left passive so the exit is driven by whoever holds the
    toast, the only place that knows whether it is still wanted. reka still emits
    update:open for its own timer, swipe and close paths

    a filled default slot owns the whole card, so none of the chrome below renders
  -->
  <ToastRoot
    :open="open"
    :duration="duration"
    v-bind="{ ...attrs, class: undefined }"
    :class="classes"
    @update:open="(isOpen: boolean) => !isOpen && emit('close')"
  >
    <slot>
      <span
        v-if="$slots.icon && severity"
        :class="cn('shrink-0', toastIconColors[severity])"
      >
        <slot name="icon" />
      </span>

      <div class="flex min-w-0 grow flex-col gap-1">
        <ToastTitle class="text-sm font-bold wrap-break-word">
          {{ title }}
        </ToastTitle>
        <ToastDescription
          v-if="description"
          class="text-sm wrap-break-word opacity-80"
        >
          {{ description }}
        </ToastDescription>
        <div
          v-if="$slots.actions"
          class="mt-1 flex flex-wrap gap-2"
        >
          <slot name="actions" />
        </div>
      </div>

      <ToastClose as-child>
        <slot name="close">
          <button
            type="button"
            aria-label="Dismiss"
            class="shrink-0 cursor-pointer rounded px-1 text-lg leading-none opacity-60 transition-opacity hover:opacity-100"
          >
            &times;
          </button>
        </slot>
      </ToastClose>
    </slot>
  </ToastRoot>
</template>

<!--
  unscoped, because reka renders the card behind a fragment and a teleport, neither of
  which passes vue's scope attribute down to the element these rules have to reach
-->
<style>
  /*
    reka's Presence holds the node only while a CSS animation runs, and it reads
    animation rather than transition, so a leave built on @starting-style would be
    dropped on the frame it started
  */
  @keyframes core-toast-in {
    from {
      transform: translateX(120%);
      opacity: 0;
    }
  }

  @keyframes core-toast-out {
    to {
      transform: translateX(120%);
      opacity: 0;
    }
  }

  /* picks up where the pointer let go rather than snapping back to run core-toast-out */
  @keyframes core-toast-swipe-out {
    from {
      transform: translateX(var(--reka-toast-swipe-end-x));
    }
    to {
      transform: translateX(120%);
    }
  }

  .core-toast[data-state='open'] {
    animation: core-toast-in 250ms cubic-bezier(0.34, 1.4, 0.64, 1);
  }

  .core-toast[data-state='closed'] {
    animation: core-toast-out 150ms ease-in forwards;
  }

  /* the card follows the pointer, so animating it would fight the hand moving it */
  .core-toast[data-swipe='move'] {
    transform: translateX(var(--reka-toast-swipe-move-x));
    animation: none;
  }

  .core-toast[data-swipe='cancel'] {
    transform: translateX(0);
    animation: none;
    transition: transform 200ms ease-out;
  }

  .core-toast[data-swipe='end'] {
    animation: core-toast-swipe-out 150ms ease-out forwards;
  }

  @media (prefers-reduced-motion: reduce) {
    .core-toast {
      animation: none;
    }
  }
</style>
