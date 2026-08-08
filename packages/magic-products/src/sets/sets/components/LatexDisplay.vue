<script setup lang="ts">
  import katex from 'katex';
  import 'katex/dist/katex.min.css';

  import { onMounted, ref, watch } from 'vue';

  const props = defineProps<{
    latex: string;
  }>();

  const el = ref<HTMLElement | null>(null);

  const renderMath = () => {
    if (!el.value) return;
    katex.render(props.latex, el.value, {
      throwOnError: false,
    });
  };

  onMounted(renderMath);
  watch(() => props.latex, renderMath);
</script>

<template>
  <span ref="el"></span>
</template>
