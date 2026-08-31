<script setup lang="ts">
  import Node from '@magic/shared/Node';
  import TruncatedText from '@magic/shared/TruncatedText';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { GNode, GraphPath } from '@magic/shared/graph';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import { useCurrentFrame } from '@magic/shared/simulation';
  import { createPathThemer, nodeRoleColors } from '@magic/shared/theme';

  import { computed, onMounted, onUnmounted, ref, watch } from 'vue';

  import { useMatrixDensity } from '../../composables/useMatrixDensity.ts';
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

  const distanceOf = (from: GNode['id'], to: GNode['id']) =>
    matrix.value?.[from]?.[to];

  const isReachable = (from: GNode['id'], to: GNode['id']) =>
    distanceOf(from, to) !== undefined;

  const cellTooltip = (from: GNode['id'], to: GNode['id']) =>
    `${graph.getNode(from).label}→${graph.getNode(to).label}: ${formatDistance(distanceOf(from, to))}`;

  const density = useMatrixDensity(() => nodeIds.value.length);

  const columnHeaderCellClass = computed(
    () =>
      `${density.value.headerClass} sticky top-0 z-10 bg-gray-200 dark:bg-gray-800`,
  );
  const cellClass = (from: GNode['id'], to: GNode['id']) => [
    density.value.dataClass,
    'overflow-hidden rounded-sm p-0 text-center font-bold tabular-nums',
    isReachable(from, to)
      ? 'bg-gray-800 text-white dark:bg-gray-900'
      : 'bg-gray-500/15',
    hasRoute(from, to) ? 'cursor-pointer' : '',
  ];
</script>

<template>
  <Well v-if="nodeIds.length > 0">
    <VStack>
      <div class="max-h-[50vh] max-w-[40vw] overflow-auto">
        <table class="table-fixed border-separate border-spacing-1">
          <thead>
            <tr>
              <th :class="columnHeaderCellClass"></th>
              <th
                v-for="to in nodeIds"
                :key="to"
                :class="columnHeaderCellClass"
              >
                <Node
                  :id="to"
                  :scale="density.nodeScale"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="from in nodeIds"
              :key="from"
            >
              <th :class="density.headerClass">
                <Node
                  :id="from"
                  :scale="density.nodeScale"
                />
              </th>
              <td
                v-for="to in nodeIds"
                :key="to"
                :class="cellClass(from, to)"
                @mouseenter="hoverCell(from, to)"
                @mouseleave="unhoverCell(from, to)"
                :style="{ backgroundColor: cellTint(from, to) }"
              >
                <div class="grid size-full place-items-center rounded-sm">
                  <TruncatedText
                    :class="`block w-full px-1 ${isReachable(from, to) ? '' : 'opacity-40'}`"
                    :tooltip="cellTooltip(from, to)"
                    :delay="400"
                  >
                    {{ formatDistance(distanceOf(from, to)) }}
                  </TruncatedText>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </VStack>
  </Well>
</template>
