<script setup lang="ts">
  import { Primitive, type PrimitiveProps } from 'reka-ui';

  import { computed, useAttrs } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';

  defineOptions({ inheritAttrs: false });

  interface Props extends PrimitiveProps {}

  withDefaults(defineProps<Props>(), {
    as: 'div',
  });

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const classes = computed(() => cn('rounded-md p-2', attrClass.value));
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    v-bind="{ ...attrs, class: undefined }"
    :class="classes"
  >
    <slot />
  </Primitive>
</template>
