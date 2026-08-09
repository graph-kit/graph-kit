<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import Button from '@magic/shared/Button';
  import katex from 'katex';

  import { onMounted, ref } from 'vue';

  const buttonTextContent = ref<HTMLSpanElement>();

  const props = defineProps<{
    latexString: string;
  }>();

  onMounted(() => {
    katex.render(
      props.latexString,
      nullThrows(
        buttonTextContent.value,
        'button text content DOM element missing',
      ),
    );
  });
</script>

<template>
  <Button><span ref="buttonTextContent"></span></Button>
</template>
