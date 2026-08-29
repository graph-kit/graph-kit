<script setup lang="ts" generic="TItem">
  import { useOverflowRow } from '@core/components/composables/useOverflowRow';
  import { mdiDotsVertical } from '@mdi/js';

  import { computed, useTemplateRef } from 'vue';

  import Dropdown from '../dropdown/Dropdown.vue';
  import IconButton from '../icon-button/IconButton.vue';
  import HStack from './HStack.vue';
  import Well from './Well.vue';

  // inline rather than a named interface: a generic component emits its props type into
  // the declaration file, and a name declared in `script setup` cannot be exported with it
  const props = defineProps<{
    items: TItem[];
    keyOf: (item: TItem) => string | number;
    /** what the overflow button announces, e.g. "More lenses" */
    label: string;
  }>();

  const row = useTemplateRef('row');
  const trigger = useTemplateRef('trigger');

  const { visibleCount } = useOverflowRow({ row, trigger });

  const overflowing = computed(() => props.items.slice(visibleCount.value));

  // taken out of the flow so the row hugs what it is showing and the trigger lands
  // against the last item still in it. w-max is what keeps the width it reports honest:
  // without it a parked item shrinks to the narrowed row
  const parked = 'absolute left-0 top-0 invisible w-max';

  // the button parks rather than leaving when there is nothing to open, so the pass that
  // decides the lineup can already read the room it will need. with nothing there to
  // measure, the first pass reserves nothing, hands back a count an item too generous,
  // and paints the trigger hanging off the row until something re-renders
  const hasOverflow = computed(() => overflowing.value.length > 0);

  defineSlots<{
    default: (props: { item: TItem; inMenu: boolean }) => unknown;
  }>();
</script>

<template>
  <HStack
    ref="row"
    class="relative"
  >
    <!-- the attribute is what useOverflowRow measures against -->
    <div
      v-for="(item, index) of items"
      :key="keyOf(item)"
      data-overflow-item
      :class="index < visibleCount ? 'shrink-0' : parked"
    >
      <slot
        :item="item"
        :in-menu="false"
      />
    </div>

    <div
      ref="trigger"
      :class="hasOverflow ? 'shrink-0' : parked"
    >
      <!-- the menu goes with the overflow that filled it, so a row that grows back
           never leaves an empty one hanging open -->
      <Dropdown
        v-if="hasOverflow"
        align="end"
        :side-offset="20"
      >
        <template #trigger>
          <IconButton
            :path="mdiDotsVertical"
            :label="label"
          />
        </template>
        <Well class="max-w-240">
          <HStack class="flex-wrap">
            <template
              v-for="item of overflowing"
              :key="keyOf(item)"
            >
              <slot
                :item="item"
                :in-menu="true"
              />
            </template>
          </HStack>
        </Well>
      </Dropdown>

      <!-- the same button with nothing behind it, so the room the trigger will need is
           readable before there is a menu to open. `as-child` means the dropdown adds no
           box of its own, so the two measure alike -->
      <IconButton
        v-else
        :path="mdiDotsVertical"
        :label="label"
      />
    </div>
  </HStack>
</template>
