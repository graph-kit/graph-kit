<script setup lang="ts">
import katex from 'katex';
import { ref, onMounted } from 'vue';

const btn = ref<HTMLButtonElement | null>(null);

const props = defineProps<{
  label: string;
}>()

onMounted(() => {
  if (!btn.value) return;

  katex.render(props.label, btn.value, {
    throwOnError: false,
  });
});
</script>

<template>
  <button ref="btn"></button>
</template>