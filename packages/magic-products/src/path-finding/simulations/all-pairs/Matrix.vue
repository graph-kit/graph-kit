<script setup lang="ts">
  import Node from '@magic/shared/Node';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { GNode, GraphPath } from '@magic/shared/graph';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import { useCurrentFrame } from '@magic/shared/simulation';
  import { createPathThemer, nodeRoleColors } from '@magic/shared/theme';

  import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

  import { formatDistance } from '../distance.ts';
  import { nodeRoles } from './effects.ts';
  import { AllPairsFrame } from './frame.ts';
  import { routeBetween } from './routeTrail.ts';

  const graph = useProvidedGraph();

  const currentFrame = useCurrentFrame<AllPairsFrame>();

  const matrix = computed(() => currentFrame.value?.matrix);

  const nodeIds = computed(() => {
    const rows = matrix.value;
    if (!rows) return [];
    return graph.nodes.value.map((node) => node.id).filter((id) => id in rows);
  });

  const cellKey = (from: GNode['id'], to: GNode['id']) => `${from} ${to}`;

  const pivotAndPair = computed<{
    pivot?: GNode['id'];
    from?: GNode['id'];
    to?: GNode['id'];
  }>(() => {
    const frame = currentFrame.value;
    if (!frame) return {};
    if (frame.type === 'choose-pivot') return { pivot: frame.node };
    const weighingAPair =
      frame.type === 'consider-pair' ||
      frame.type === 'improve-pair' ||
      frame.type === 'keep-pair';
    if (weighingAPair)
      return { pivot: frame.pivot, from: frame.from, to: frame.to };
    return {};
  });

  const routeByCell = computed(() => {
    const trail = currentFrame.value?.routes;
    const found = new Map<string, GraphPath>();
    if (!trail) return found;

    for (const from of nodeIds.value) {
      for (const to of nodeIds.value) {
        const route = routeBetween(graph, trail, from, to);
        if (route.length > 0) found.set(cellKey(from, to), route);
      }
    }

    return found;
  });

  const hoveredCell = ref<string>();

  const hoveredRoute = computed(
    () => (hoveredCell.value && routeByCell.value.get(hoveredCell.value)) || [],
  );

  const routeThemer = createPathThemer(graph);
  watch(hoveredRoute, routeThemer.setPath);

  onMounted(() => routeThemer.themer.activate());
  onUnmounted(() => routeThemer.themer.deactivate());

  const PIVOT_TINT = nodeRoleColors[nodeRoles.pivot] + '33';
  const PAIR_TINT = nodeRoleColors[nodeRoles.pair] + '66';

  // the cell wears the color its route is being painted in out on the canvas
  const hoveredTint = computed(() => {
    const firstEdge = hoveredRoute.value.at(0);
    if (firstEdge === undefined) return;
    const color = graph.focus.theme._resolveToken(
      'edge.focus.color',
      graph.getEdge(firstEdge),
    );
    return `${color}55`;
  });

  const cellTint = (from: GNode['id'], to: GNode['id']) => {
    if (hoveredCell.value === cellKey(from, to)) return hoveredTint.value;
    const { pivot, from: pairFrom, to: pairTo } = pivotAndPair.value;
    if (from === pairFrom && to === pairTo) return PAIR_TINT;
    if (from === pivot || to === pivot) return PIVOT_TINT;
  };

  const hasRoute = (from: GNode['id'], to: GNode['id']) =>
    routeByCell.value.has(cellKey(from, to));

  const hoverCell = (from: GNode['id'], to: GNode['id']) => {
    if (hasRoute(from, to)) hoveredCell.value = cellKey(from, to);
  };

  const unhoverCell = (from: GNode['id'], to: GNode['id']) => {
    if (hoveredCell.value === cellKey(from, to)) hoveredCell.value = undefined;
  };
</script>

<template>
  <Well v-if="nodeIds.length > 0">
    <VStack class="gap-2">
      <span class="text-sm font-bold opacity-60">From \ To</span>
      <div class="max-h-[50vh] max-w-[40vw] overflow-auto">
        <table class="border-separate border-spacing-1">
          <thead>
            <tr>
              <th></th>
              <th
                v-for="to in nodeIds"
                :key="to"
              >
                <Node
                  :id="to"
                  :scale="0.45"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="from in nodeIds"
              :key="from"
            >
              <th>
                <Node
                  :id="from"
                  :scale="0.45"
                />
              </th>
              <td
                v-for="to in nodeIds"
                :key="to"
                class="rounded-sm px-2 text-center font-bold tabular-nums"
                :class="hasRoute(from, to) ? 'cursor-pointer' : ''"
                :style="{ backgroundColor: cellTint(from, to) }"
                @mouseenter="hoverCell(from, to)"
                @mouseleave="unhoverCell(from, to)"
              >
                {{ formatDistance(matrix?.[from]?.[to]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </VStack>
  </Well>
</template>
