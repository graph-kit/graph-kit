<script setup lang="ts">
  import {
    DropdownMenuPortal,
    DropdownMenuSub,
    DropdownMenuSubContent,
    DropdownMenuSubTrigger,
  } from 'reka-ui';

  import { computed, inject, onUnmounted, ref, useAttrs } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';
  import { dropdownContentClasses } from './classes.ts';
  import { menuUsingPointerKey } from './modality.ts';

  defineOptions({ inheritAttrs: false });

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const classes = computed(() => cn(dropdownContentClasses, attrClass.value));

  // closing runs through the menu that owns this one, which never sees these events
  const usingPointer = inject(menuUsingPointerKey, undefined);

  const noteModality = (isPointer: boolean) => {
    if (usingPointer) usingPointer.value = isPointer;
  };

  const open = ref(false);

  /**
   * pressing a submenu row asks for that submenu, so a close reached for while the press
   * is still on the trigger is the click taking back what the row just asked for
   */
  const pressingTrigger = ref(false);

  // the click rides the release, so the hold has to outlast the task that carries it
  const releaseOnPointerUp = () =>
    setTimeout(() => (pressingTrigger.value = false));

  const holdOpenThroughPress = () => {
    pressingTrigger.value = true;
    // the release can land anywhere, so window owns it rather than the trigger
    window.addEventListener('pointerup', releaseOnPointerUp, { once: true });
  };

  // a press the menu outlives removes itself, one that closes the menu does not
  onUnmounted(() =>
    window.removeEventListener('pointerup', releaseOnPointerUp),
  );

  const onOpenChange = (isOpen: boolean) => {
    if (!isOpen && pressingTrigger.value) return;
    open.value = isOpen;
  };

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
  <DropdownMenuSub
    :open="open"
    @update:open="onOpenChange"
  >
    <DropdownMenuSubTrigger
      as-child
      @pointerdown="holdOpenThroughPress"
    >
      <slot name="trigger" />
    </DropdownMenuSubTrigger>
    <DropdownMenuPortal>
      <DropdownMenuSubContent
        :side-offset="6"
        v-bind="{ ...attrs, class: undefined }"
        :class="classes"
        @pointerdown="noteModality(true)"
        @keydown="noteModality(false)"
      >
        <slot />
      </DropdownMenuSubContent>
    </DropdownMenuPortal>
  </DropdownMenuSub>
</template>
