<script setup lang="ts">
  import { StyleValue, computed, onUnmounted } from 'vue';

  import { GNode } from '../../graph/types.ts';
  import { useProvidedGraph } from '../../product/context.ts';
  import { useNodeStyles } from '../../theme/index.ts';

  const props = withDefaults(
    defineProps<{
      id: GNode['id'];
      scale?: number;
    }>(),
    { scale: 1 },
  );

  const graph = useProvidedGraph();

  const { styles, dispose } = useNodeStyles(graph, () => props.id);

  const toPixels = (number: number) => number + 'px';

  const nodeStyle = computed<StyleValue>(() => ({
    width: toPixels(styles.value.size * 2 * props.scale),
    height: toPixels(styles.value.size * 2 * props.scale),
    borderStyle: 'solid',
    borderWidth: toPixels(styles.value.border.width * props.scale),
    borderColor: styles.value.border.color,
    backgroundColor: styles.value.color,
    fontSize: toPixels(styles.value.text.fontSize * props.scale),
    fontWeight: styles.value.text.fontWeight,
    display: 'grid',
    placeItems: 'center',
  }));

  onUnmounted(dispose);
</script>

<template>
  <div
    @click="graph.focus.set([id])"
    class="rounded-full cursor-pointer"
    :style="nodeStyle"
  >
    <span class="label">{{ styles.text.content }}</span>
  </div>
</template>

<style scoped>
  /*
    centering aligns the line box, which reserves the font's descender space
    below the baseline. a label made of caps and digits never reaches into that
    space, so the glyph settles below the middle. trimming the box to the cap
    and baseline edges makes the letterforms themselves the thing being
    centered. the trim has to sit on the element that holds the text, not on the
    grid container above it.
  */
  .label {
    display: block;
    line-height: 1;
    text-box: trim-both cap alphabetic;
  }
</style>
