<script setup lang="ts">
  import { Primitive, type PrimitiveProps } from 'reka-ui';

  import { computed, useAttrs } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';

  defineOptions({ inheritAttrs: false });

  withDefaults(defineProps<PrimitiveProps>(), {
    as: 'input',
  });

  const model = defineModel<string>({ default: '' });

  const base =
    'w-full rounded-md px-2 py-1 text-md transition-colors focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 placeholder:font-bold';

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const classes = computed(() => cn(base, attrClass.value));

  const onInput = (event: Event) => {
    model.value = (event.target as HTMLInputElement).value;
  };
</script>

<template>
  <Primitive
    :as="as"
    :as-child="asChild"
    v-bind="{ ...attrs, class: undefined }"
    :class="classes"
    :value="model"
    @input="onInput"
  />
</template>
