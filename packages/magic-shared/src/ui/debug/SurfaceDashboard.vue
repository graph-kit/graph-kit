<script setup lang="ts">
  import type { ElementsUnderCursor } from '@canvas/surface/events/index';
  import type { DeepReadonly } from 'ts-essentials';

  import { computed, onBeforeUnmount, ref } from 'vue';

  import { useProvidedShell } from '../../product/context.ts';
  import DebugBar from './shared/DebugBar.vue';
  import DebugMore from './shared/DebugMore.vue';
  import DebugPanel from './shared/DebugPanel.vue';
  import DebugRow from './shared/DebugRow.vue';
  import DebugSection from './shared/DebugSection.vue';
  import DebugToggle from './shared/DebugToggle.vue';
  import { LABEL, STATUS_CLASSES, VALUE } from './shared/classes.ts';
  import { useRepaintSample } from './shared/useRepaintSample.ts';

  const SHAPES_LISTED = 4;
  const ELEMENTS_LISTED = 4;

  const HEALTHY_FPS = 55;
  const DEGRADED_FPS = 30;

  const shell = useProvidedShell();
  const surface = shell.surface;

  const elementCount = ref(0);
  const hitTestableCount = ref(0);
  const animatingCount = ref(0);
  const shapeCounts = ref<[string, number][]>([]);
  const viewport = ref({ width: 0, height: 0, dpr: 1 });

  /** the aggregator is a plain array behind a getter, so its counts are polled */
  const sampleSurface = () => {
    const aggregator = surface.aggregator.aggregator();
    const countByShape = new Map<string, number>();
    let hitTestable = 0;

    for (const element of aggregator) {
      if (!element.paintOnly) hitTestable++;
      const { name } = element.shape;
      countByShape.set(name, (countByShape.get(name) ?? 0) + 1);
    }

    elementCount.value = aggregator.length;
    hitTestableCount.value = hitTestable;
    shapeCounts.value = [...countByShape].sort(
      ([, previousCount], [, nextCount]) => nextCount - previousCount,
    );

    animatingCount.value = surface.renderer.activeAnimations.size;

    const canvas = surface.canvas.value;
    if (canvas) {
      viewport.value = {
        width: canvas.clientWidth,
        height: canvas.clientHeight,
        dpr: canvas.width / (canvas.clientWidth || 1),
      };
    }
  };

  const { fps, frameMs } = useRepaintSample(surface, sampleSurface);

  const underCursor = ref<{ name: string; id: string }[]>([]);

  /*
    hover rides its own event rather than the sample, since a readout that trails the
    pointer by a quarter second reads as broken. topmost first, since that is the one
    a click would land on
  */
  const onElementsUnderCursorChange = ({
    elements,
  }: DeepReadonly<ElementsUnderCursor>) => {
    underCursor.value = elements
      .map(({ id, shape }) => ({ id, name: shape.name }))
      .reverse();
  };

  surface.events.elements.subscribe(
    'onElementsUnderCursorChange',
    onElementsUnderCursorChange,
  );

  onBeforeUnmount(() => {
    surface.events.elements.unsubscribe(
      'onElementsUnderCursorChange',
      onElementsUnderCursorChange,
    );
  });

  const showBackgroundPattern = computed({
    get: () => !surface.draw.backgroundPatternSuspended.value,
    set: (isVisible) => {
      surface.draw.backgroundPatternSuspended.value = !isVisible;
    },
  });

  /*
    the suspend flags outlive this panel, so leaving debug mode with one held would
    strand the canvas in a state nothing on screen can undo
  */
  onBeforeUnmount(() => {
    surface.draw.backgroundPatternSuspended.value = false;
  });

  const round = (value: number) => Math.round(value).toLocaleString();

  const cursor = computed(() => {
    const { x, y } = surface.cursorCoordinates.value;
    return `${round(x)}, ${round(y)}`;
  });

  const zoom = computed(() => `${surface.camera.state.zoom.value.toFixed(2)}×`);

  const pan = computed(() => {
    const { panX, panY } = surface.camera.state;
    return `${round(panX.value)}, ${round(panY.value)}`;
  });

  const worldOrigin = computed(() => {
    const { at } = surface.visibleWorldRect.value;
    return `${round(at.x)}, ${round(at.y)}`;
  });

  const worldSize = computed(() => {
    const { width, height } = surface.visibleWorldRect.value;
    return `${round(width)} × ${round(height)}`;
  });

  const fpsClasses = computed(() => {
    if (fps.value >= HEALTHY_FPS) return STATUS_CLASSES.good;
    if (fps.value >= DEGRADED_FPS) return STATUS_CLASSES.warn;
    return STATUS_CLASSES.bad;
  });

  const listedElements = computed(() =>
    underCursor.value.slice(0, ELEMENTS_LISTED),
  );

  const listedShapes = computed(() =>
    shapeCounts.value.slice(0, SHAPES_LISTED),
  );

  /** the busiest shape sets the full width bar every other one is measured against */
  const busiestShapeCount = computed(() => shapeCounts.value[0]?.[1] ?? 0);
</script>

<template>
  <DebugPanel title="Surface">
    <template #badge>
      <span :class="[VALUE, fpsClasses, 'font-bold']">{{ fps }} fps</span>
    </template>

    <DebugSection title="Controls">
      <DebugToggle
        v-model="showBackgroundPattern"
        label="background pattern"
      />
    </DebugSection>

    <DebugSection title="Cursor">
      <DebugRow label="world">{{ cursor }}</DebugRow>
      <DebugRow label="over">
        <span v-if="underCursor.length">{{ underCursor.length }}</span>
        <span
          v-else
          :class="LABEL"
        >
          nothing
        </span>
      </DebugRow>
      <DebugRow
        v-for="{ id, name } of listedElements"
        :key="id"
        :label="name"
        :title="id"
        fixed-label
      >
        {{ id }}
      </DebugRow>
      <DebugMore :count="underCursor.length - listedElements.length" />
    </DebugSection>

    <DebugSection title="Camera">
      <DebugRow label="zoom">{{ zoom }}</DebugRow>
      <DebugRow label="pan">{{ pan }}</DebugRow>
      <DebugRow label="canvas">
        {{ viewport.width }} &times; {{ viewport.height }}
        <span :class="LABEL">@{{ viewport.dpr.toFixed(1) }}&times;</span>
      </DebugRow>
      <DebugRow label="world at">{{ worldOrigin }}</DebugRow>
      <DebugRow label="world size">{{ worldSize }}</DebugRow>
    </DebugSection>

    <DebugSection title="Render">
      <DebugRow label="frame">{{ frameMs.toFixed(2) }} ms</DebugRow>
      <DebugRow label="elements">
        {{ elementCount }}
        <span :class="LABEL">/ {{ hitTestableCount }} hit</span>
      </DebugRow>
      <DebugRow label="animating">{{ animatingCount }}</DebugRow>
    </DebugSection>

    <DebugSection
      v-if="listedShapes.length"
      title="Shapes"
    >
      <DebugBar
        v-for="[name, count] of listedShapes"
        :key="name"
        :label="name"
        :value="count"
        :max="busiestShapeCount"
      />
      <DebugMore :count="shapeCounts.length - listedShapes.length" />
    </DebugSection>
  </DebugPanel>
</template>
