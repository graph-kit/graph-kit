<script setup lang="ts">
  import {
    DropdownMenuContent,
    type DropdownMenuContentProps,
    DropdownMenuPortal,
    DropdownMenuRoot,
    DropdownMenuTrigger,
  } from 'reka-ui';

  import { computed, onUnmounted, ref, useAttrs } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';
  import { dropdownContentClasses } from './classes.ts';

  defineOptions({ inheritAttrs: false });

  interface Props {
    side?: DropdownMenuContentProps['side'];
    align?: DropdownMenuContentProps['align'];
    /** hover adds pointer intent on top of the click and keyboard paths rather than replacing them */
    openOn?: 'click' | 'hover';
  }

  const props = withDefaults(defineProps<Props>(), {
    side: 'bottom',
    align: 'start',
    openOn: 'click',
  });

  /** long enough to cross the gap between the trigger and the menu, short enough to read as a dismissal */
  const HOVER_CLOSE_DELAY_MS = 150;

  const open = ref(false);

  /** a hover carries no focus intent, so reka's focus handoffs sit out until a click or a key opens the menu */
  const openedByHover = ref(false);

  let closeTimeout: ReturnType<typeof setTimeout> | undefined;

  const cancelPendingClose = () => clearTimeout(closeTimeout);

  onUnmounted(cancelPendingClose);

  // touch reports a pointerenter on tap, which would race reka's own click handling
  const isHoverIntent = (event: PointerEvent) =>
    props.openOn === 'hover' && event.pointerType !== 'touch';

  const openOnHover = (event: PointerEvent) => {
    if (!isHoverIntent(event)) return;
    cancelPendingClose();
    openedByHover.value = true;
    open.value = true;
  };

  const closeOnHover = (event: PointerEvent) => {
    if (!isHoverIntent(event)) return;
    cancelPendingClose();
    closeTimeout = setTimeout(() => (open.value = false), HOVER_CLOSE_DELAY_MS);
  };

  /**
   * closing hands focus back to the trigger, which for a pointer user lands a tooltip on
   * it that nobody asked for, since the browser reads a scripted focus move out of the
   * menu as keyboard focus. a key press is the one case where the handoff was wanted.
   */
  const usingPointer = ref(false);

  // reka drives this from clicks, keys and dismissals, each of which owns where focus lands
  const onOpenChange = (isOpen: boolean) => {
    openedByHover.value = false;
    // closing runs ahead of the focus handoff, so the modality only resets on the way in
    if (isOpen) usingPointer.value = false;
    open.value = isOpen;
  };

  const keepFocusPut = (event: Event) => {
    if (openedByHover.value || usingPointer.value) event.preventDefault();
  };

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const classes = computed(() => cn(dropdownContentClasses, attrClass.value));
</script>

<template>
  <!--
    non-modal so the menu behaves like canvas chrome rather than a dialog. a modal
    menu traps focus and disables pointer events on the rest of the page, which
    means the click that dismisses it never reaches the canvas underneath, leaving
    the canvas unfocused and reka handing focus to the trigger button on close.
    non-modal lets that click through to the canvas and opts into reka's own
    outside-dismissal path, which skips the focus handoff. escape still returns
    focus to the trigger, since there is nowhere else sensible to land.
  -->
  <DropdownMenuRoot
    :modal="false"
    :open="open"
    @update:open="onOpenChange"
  >
    <DropdownMenuTrigger
      as-child
      @pointerenter="openOnHover"
      @pointerleave="closeOnHover"
    >
      <slot name="trigger" />
    </DropdownMenuTrigger>
    <DropdownMenuPortal>
      <!-- the menu is part of the hover target, so crossing into it has to call off the pending close -->
      <DropdownMenuContent
        :side="side"
        :align="align"
        :side-offset="6"
        v-bind="{ ...attrs, class: undefined }"
        :class="classes"
        @pointerenter="cancelPendingClose"
        @pointerleave="closeOnHover"
        @pointerdown="usingPointer = true"
        @keydown="usingPointer = false"
        @open-auto-focus="keepFocusPut"
        @close-auto-focus="keepFocusPut"
      >
        <slot />
      </DropdownMenuContent>
    </DropdownMenuPortal>
  </DropdownMenuRoot>
</template>
