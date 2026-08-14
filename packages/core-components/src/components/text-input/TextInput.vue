<script setup lang="ts">
  import { Primitive, type PrimitiveProps } from 'reka-ui';

  import { computed, useAttrs } from 'vue';

  import { cn } from '../../cn.ts';
  import { useAttrClass } from '../../composables/useAttrClass.ts';

  defineOptions({ inheritAttrs: false });

  interface Props extends PrimitiveProps {
    /**
     * whether the model updates on every keystroke or once the field settles. lazy
     * suits a value with a cost per write, eager suits one that only lives locally
     */
    updateOn?: 'input' | 'change';
  }

  const props = withDefaults(defineProps<Props>(), {
    as: 'input',
    updateOn: 'input',
  });

  const model = defineModel<string>({ default: '' });

  const base =
    'w-full rounded-md px-2 py-1 text-md transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50';

  const attrs = useAttrs();

  const attrClass = useAttrClass();

  const classes = computed(() => cn(base, attrClass.value));

  const write = (event: Event) => {
    model.value = (event.target as HTMLInputElement).value;
  };

  const onInput = (event: Event) => {
    if (props.updateOn !== 'input') return;
    write(event);
  };

  const onChange = (event: Event) => {
    if (props.updateOn !== 'change') return;
    write(event);
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
    @change="onChange"
  />
</template>
