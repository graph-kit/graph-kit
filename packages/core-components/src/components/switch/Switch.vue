<script setup lang="ts">
  import { SwitchRoot, SwitchThumb } from 'reka-ui';

  import { computed, useAttrs } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';
  import { preventFocusSteal } from '../../preventFocusSteal.ts';
  import { switchThumbClasses, switchTrackClasses } from './variants.ts';

  defineOptions({ inheritAttrs: false });

  interface Props {
    disabled?: boolean;
    /** classes for the thumb, since the fallthrough class lands on the track */
    thumbClass?: string;
  }

  const props = defineProps<Props>();

  // works whether the consumer passes v-model or not: bound if they do,
  // otherwise a plain local ref that just holds its own state.
  const checked = defineModel<boolean>();

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const trackClasses = computed(() => cn(switchTrackClasses, attrClass.value));

  const thumbClasses = computed(() => cn(switchThumbClasses, props.thumbClass));
</script>

<template>
  <SwitchRoot
    v-model="checked"
    :disabled="disabled"
    v-bind="{ ...attrs, class: undefined }"
    :class="trackClasses"
    @mousedown="preventFocusSteal"
  >
    <SwitchThumb :class="thumbClasses" />
  </SwitchRoot>
</template>
