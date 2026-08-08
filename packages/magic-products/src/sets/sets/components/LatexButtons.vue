<script setup lang="ts">
import LatexButton from "./LatexButton.vue";

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
      :label="key"
      class="bg-gray-900 text-white p-2 rounded-md w-10 h-10 mr-2 mt-2"
    />
  </div>
</template>
