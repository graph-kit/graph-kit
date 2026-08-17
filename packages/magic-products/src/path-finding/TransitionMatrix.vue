<script setup lang="ts">
  import colors from '@core/utils/colors';
  import Node from '@magic/shared/Node';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/graph-product';

  import { computed, ref } from 'vue';

  import TransitionMatrixCell from './TransitionMatrixCell.vue';

  const graph = useProvidedGraph();

  // the plugin indexes rows/columns by position in this same node list, so the
  // two stay aligned without carrying a separate id -> index map around
  const nodeIds = computed(() => graph.nodes.value.map((node) => node.id));

  const weightOf = (from: number, to: number) =>
    graph.transitionMatrix.value[from][to].valueOf();

  const indexOfId = computed(() => {
    const map = new Map<string, number>();
    nodeIds.value.forEach((id, index) => map.set(id, index));
    return map;
  });

  // the transition matrix defaults every non-edge pair to a weight of 0, so a
  // real edge weighted at 0 (or negative) is indistinguishable from "no edge"
  // by weight alone - track actual edge ids separately so those legitimate
  // weights still render and so a cell can be clicked to select its edge
  const edgeIdByPair = computed(() => {
    const ids = new Map<string, string>();
    graph.edges.value.forEach((edge) => {
      ids.set(`${edge.source}->${edge.target}`, edge.id);
      if (!graph.metadata.directed)
        ids.set(`${edge.target}->${edge.source}`, edge.id);
    });
    return ids;
  });

  const edgeIdFor = (from: string, to: string) =>
    edgeIdByPair.value.get(`${from}->${to}`);

  const hasEdge = (from: string, to: string) => !!edgeIdFor(from, to);

  const focusEdge = (from: string, to: string) => {
    const edgeId = edgeIdFor(from, to);
    if (edgeId) graph.focus.set([edgeId]);
  };

  // greedy nearest-neighbor ordering: starting from the most-connected state,
  // repeatedly append whichever unplaced state has the strongest combined
  // in/out transition to the state just placed. this clusters strongly-related
  // states next to each other so hot cells collapse into diagonal bands
  // instead of scattering across an arbitrary row/column order
  const displayOrder = computed(() => {
    const n = nodeIds.value.length;
    if (n === 0) return [];

    const affinity = (a: number, b: number) => weightOf(a, b) + weightOf(b, a);

    const totalAffinity = Array.from({ length: n }, (_, index) =>
      Array.from({ length: n }, (_, other) => affinity(index, other)).reduce(
        (sum, value) => sum + value,
        0,
      ),
    );

    const mostConnected = (candidates: Iterable<number>) =>
      Array.from(candidates).reduce((best, index) =>
        totalAffinity[index] > totalAffinity[best] ? index : best,
      );

    const remaining = new Set(Array.from({ length: n }, (_, index) => index));
    let current = mostConnected(remaining);
    remaining.delete(current);
    const order = [current];

    while (remaining.size > 0) {
      let next = -1;
      let bestAffinity = -1;
      for (const candidate of remaining) {
        const score = affinity(current, candidate);
        if (score > bestAffinity) {
          bestAffinity = score;
          next = candidate;
        }
      }
      // nothing left is connected to the current chain - start a fresh chain
      // from whichever unplaced state is most connected overall
      if (bestAffinity === 0) next = mostConnected(remaining);

      remaining.delete(next);
      order.push(next);
      current = next;
    }

    return order;
  });

  const hoveredEdgeId = ref<string>();
  const hoveredRowFrom = ref<string>();
  const hoveredColTo = ref<string>();

  graph.canvas.events.subscribe('onHoveredElementChange', (element) => {
    hoveredEdgeId.value = undefined;
    if (!element) return;
    if (graph.isEdge(element.id)) hoveredEdgeId.value = element.id;
  });

  // mirrors the edge's real selection state (settable from the cell itself,
  // a node/edge on the canvas, anywhere) rather than a matrix-only concept of
  // "selected"
  const focusedEdgeIds = computed(
    () => new Set(graph.focus.focusedEdges.value.map((edge) => edge.id)),
  );

  // whether a cell is implicated by whatever's currently hovered - the
  // matrix row, the matrix column, or this exact edge hovered on the canvas
  const isRowColOrEdgeActive = (from: string, to: string) => {
    if (hoveredRowFrom.value) return hoveredRowFrom.value === from;
    if (hoveredColTo.value) return hoveredColTo.value === to;
    if (hoveredEdgeId.value) {
      return edgeIdByPair.value.get(`${from}->${to}`) === hoveredEdgeId.value;
    }
    return false;
  };

  const isHoverActive = computed(
    () => !!(hoveredRowFrom.value || hoveredColTo.value || hoveredEdgeId.value),
  );

  // once something is hovered, dim every cell that isn't implicated so the
  // relevant row/cell reads clearly against everything else
  const cellOpacity = (from: string, to: string) =>
    isHoverActive.value && !isRowColOrEdgeActive(from, to) ? 0.3 : 1;

  const HEAT_COLOR = colors.INDIGO_500;
  const NEGATIVE_COLOR = colors.ROSE_500;
  const HOVER_BORDER_COLOR = colors.AMBER_500;
  const FOCUS_BORDER_COLOR = colors.BLUE_600;

  const alphaHex = (value: number) =>
    Math.round(Math.max(0, Math.min(1, value)) * 255)
      .toString(16)
      .padStart(2, '0');

  // weights aren't bounded to [0, 1] - normalize intensity against the
  // largest magnitude actually present so the border colors stay legible
  // however the weights are scaled
  const maxAbsWeight = computed(() => {
    let max = 0;
    nodeIds.value.forEach((fromId, fromIndex) => {
      nodeIds.value.forEach((toId, toIndex) => {
        if (!hasEdge(fromId, toId)) return;
        max = Math.max(max, Math.abs(weightOf(fromIndex, toIndex)));
      });
    });
    return max || 1;
  });

  // a cell with a real edge always gets a border, so the grid is visibly
  // linked to actual edges rather than to arbitrary node pairs - its color
  // signals hover (amber) or focus (blue, matching the app's selection
  // color) when relevant, and otherwise encodes the edge's weight (sign and
  // magnitude)
  const cellBorderColor = (fromId: string, toId: string) => {
    const edgeId = edgeIdFor(fromId, toId);
    if (!edgeId) return undefined;
    if (hoveredEdgeId.value === edgeId) return HOVER_BORDER_COLOR;
    if (focusedEdgeIds.value.has(edgeId)) return FOCUS_BORDER_COLOR;
    const value = weightOf(
      indexOfId.value.get(fromId)!,
      indexOfId.value.get(toId)!,
    );
    const intensity =
      0.5 + Math.min(Math.abs(value) / maxAbsWeight.value, 1) * 0.5;
    return (value < 0 ? NEGATIVE_COLOR : HEAT_COLOR) + alphaHex(intensity);
  };

  const cellText = (fromId: string, toId: string) => {
    if (!hasEdge(fromId, toId)) return '';
    const fromIndex = indexOfId.value.get(fromId)!;
    const toIndex = indexOfId.value.get(toId)!;
    return graph.transitionMatrix.value[fromIndex][toIndex].toFraction();
  };

  // a row header is the "from" state, so clicking it should filter down to
  // what it leads to; a column header is the "to" state, so clicking it
  // should filter down to what leads into it - never both directions at once
  const successorsOf = (id: string) =>
    nodeIds.value.filter((otherId) => otherId !== id && hasEdge(id, otherId));

  const predecessorsOf = (id: string) =>
    nodeIds.value.filter((otherId) => otherId !== id && hasEdge(otherId, id));

  const focusFromState = (id: string) =>
    graph.focus.set([id, ...successorsOf(id)]);

  const focusToState = (id: string) =>
    graph.focus.set([id, ...predecessorsOf(id)]);
</script>

<template>
  <Well v-if="nodeIds.length > 0">
    <VStack class="gap-2">
      <span class="text-sm font-bold opacity-60">From \ To</span>
      <span class="text-xs opacity-50">
        Rows/columns are grouped by connection strength · fill is the linked
        edge's own color · blank means no edge · border shows the edge's
        weight (blue = selected, amber = hovered)
      </span>
      <div class="max-h-[50vh] max-w-[40vw] overflow-auto">
        <table class="border-separate border-spacing-1">
          <thead>
            <tr>
              <th class="size-16"></th>
              <th
                v-for="toIndex in displayOrder"
                :key="nodeIds[toIndex]"
                class="size-16"
                @click="focusToState(nodeIds[toIndex])"
                @mouseenter="hoveredColTo = nodeIds[toIndex]"
                @mouseleave="hoveredColTo = undefined"
              >
                <Node :id="nodeIds[toIndex]" />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="fromIndex in displayOrder"
              :key="nodeIds[fromIndex]"
            >
              <th
                class="size-16"
                @click="focusFromState(nodeIds[fromIndex])"
                @mouseenter="hoveredRowFrom = nodeIds[fromIndex]"
                @mouseleave="hoveredRowFrom = undefined"
              >
                <Node :id="nodeIds[fromIndex]" />
              </th>
              <template
                v-for="toIndex in displayOrder"
                :key="`${nodeIds[fromIndex]}::${edgeIdFor(nodeIds[fromIndex], nodeIds[toIndex]) ?? 'none'}`"
              >
                <TransitionMatrixCell
                  v-if="edgeIdFor(nodeIds[fromIndex], nodeIds[toIndex])"
                  :edge-id="edgeIdFor(nodeIds[fromIndex], nodeIds[toIndex])!"
                  v-slot="{ color, cursor }"
                >
                  <td
                    class="size-16 overflow-hidden text-ellipsis whitespace-nowrap rounded-sm border-2 px-1 text-center font-bold text-white tabular-nums transition-[opacity,background-color,border-color] duration-150"
                    :class="{
                      'font-normal text-gray-300': fromIndex === toIndex,
                    }"
                    :style="{
                      backgroundColor: color,
                      borderColor: cellBorderColor(
                        nodeIds[fromIndex],
                        nodeIds[toIndex],
                      ),
                      opacity: cellOpacity(
                        nodeIds[fromIndex],
                        nodeIds[toIndex],
                      ),
                      cursor,
                    }"
                    @click="focusEdge(nodeIds[fromIndex], nodeIds[toIndex])"
                  >
                    {{ cellText(nodeIds[fromIndex], nodeIds[toIndex]) }}
                  </td>
                </TransitionMatrixCell>
                <td
                  v-else
                  class="size-16 rounded-sm border-2 border-transparent transition-opacity duration-150"
                  :style="{
                    opacity: cellOpacity(nodeIds[fromIndex], nodeIds[toIndex]),
                  }"
                ></td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </VStack>
  </Well>
</template>
