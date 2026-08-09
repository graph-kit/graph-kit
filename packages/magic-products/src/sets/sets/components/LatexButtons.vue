<script setup lang="ts">
  import LatexButton from './LatexButton.vue';

  defineProps<{
    keys: Record<string, string>;
  }>();

  const emit = defineEmits<{
    insert: [symbol: string];
  }>();
</script>

<template>
  <div class="flex">
    <LatexButton
      v-for="key in keys"
      :key="key"
      @click="emit('insert', key)"
      :latexString="key"
    />
  </div>
</template>
