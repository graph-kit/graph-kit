<script setup lang="ts">
  import Node from '@magic/shared/Node';
  import Tooltip from '@magic/shared/Tooltip';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { GNode } from '@magic/shared/graph';
  import { useProvidedGraph } from '@magic/shared/graph-product';

  import { computed } from 'vue';

  import TransitionMatrixCell from './TransitionMatrixCell.vue';
  import { useTransitionMatrixGrid } from './composables/useTransitionMatrixGrid.ts';

  const graph = useProvidedGraph();

  const { nodeIds, grid } = useTransitionMatrixGrid(graph);

  const labelOf = (id: GNode['id']) => graph.getNode(id).label;

  const matrixRows = computed(() =>
    nodeIds.value.map((fromId, fromIndex) => ({
      id: fromId,
      fromIndex,
      cells: nodeIds.value.map((toId, toIndex) => ({
        id: toId,
        edge: grid.value[fromIndex][toIndex],
      })),
    })),
  );

  const cellLabel = (fromId: GNode['id'], toId: GNode['id']) =>
    `${labelOf(fromId)}→${labelOf(toId)}`;

  const transitionMatrixIndexOf = computed(() => {
    const map = new Map<string, number>();
    graph.nodes.value.forEach((node, index) => map.set(node.id, index));
    return map;
  });

  const cellText = (fromId: GNode['id'], toId: GNode['id']) => {
    const fromIndex = transitionMatrixIndexOf.value.get(fromId)!;
    const toIndex = transitionMatrixIndexOf.value.get(toId)!;
    return graph.transitionMatrix.value[fromIndex][toIndex].toFraction();
  };

  const focusEdge = (edgeId: string) => graph.focus.set([edgeId]);

  const focusFromState = (fromId: GNode['id'], fromIndex: number) => {
    const edgeIds = grid.value[fromIndex]
      .map((edge, toIndex) =>
        edge && nodeIds.value[toIndex] !== fromId ? edge.id : undefined,
      )
      .filter((id): id is string => id !== undefined);
    graph.focus.set([fromId, ...edgeIds]);
  };

  const focusToState = (toId: GNode['id'], toIndex: number) => {
    const edgeIds = grid.value
      .map((row, fromIndex) =>
        row[toIndex] && nodeIds.value[fromIndex] !== toId
          ? row[toIndex]!.id
          : undefined,
      )
      .filter((id): id is string => id !== undefined);
    graph.focus.set([toId, ...edgeIds]);
  };

  const density = computed(() => {
    const count = graph.nodes.value.length;
    if (count > 12) return { cellSize: 6, nodeScale: 0.325 };
    if (count > 7) return { cellSize: 8, nodeScale: 0.5 };
    if (count > 5) return { cellSize: 10, nodeScale: 0.625 };
    return { cellSize: 12, nodeScale: 0.75 };
  });

  // TODO: handle overflow with component: https://github.com/graph-kit/graph-kit/issues/909
  const sizeClasses: Record<number, string> = {
    6: 'size-6 text-xs',
    8: 'size-8 text-sm',
    10: 'size-10',
    12: 'size-12',
  };
  const dataCellSizeClasses: Record<number, string> = {
    6: 'size-6 max-w-6 text-xs',
    8: 'size-8 max-w-8 text-sm',
    10: 'size-10 max-w-10',
    12: 'size-12 max-w-12',
  };

  const headerCellClass = computed(() => sizeClasses[density.value.cellSize]);
  const columnHeaderCellClass = computed(
    () =>
      // I don't like this being hard coded, suggestions welcome. I couldn't find a constant anywhere. could forego the feature if thats more practical
      `${headerCellClass.value} sticky top-0 z-10 bg-gray-200 dark:bg-gray-800`,
  );
  const emptyCellClass = computed(
    () =>
      `${sizeClasses[density.value.cellSize]} rounded-sm bg-gray-500/20 text-center font-bold opacity-40`,
  );
  const dataCellClass = computed(
    () =>
      `${dataCellSizeClasses[density.value.cellSize]} overflow-hidden rounded-sm text-center font-bold text-white tabular-nums`,
  );
</script>

<template>
  <Well>
    <VStack v-if="nodeIds.length > 0">
      <div class="max-h-[50vh] max-w-[40vw] overflow-auto">
        <table class="table-fixed border-separate border-spacing-1">
          <thead>
            <tr>
              <th :class="columnHeaderCellClass"></th>
              <th
                v-for="(toId, toIndex) in nodeIds"
                :key="toId"
                :class="columnHeaderCellClass"
                @click="focusToState(toId, toIndex)"
              >
                <Node
                  :id="toId"
                  :scale="density.nodeScale"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in matrixRows"
              :key="row.id"
            >
              <th
                :class="headerCellClass"
                @click="focusFromState(row.id, row.fromIndex)"
              >
                <Node
                  :id="row.id"
                  :scale="density.nodeScale"
                />
              </th>
              <template
                v-for="cell in row.cells"
                :key="`${row.id}::${cell.id}`"
              >
                <TransitionMatrixCell
                  v-if="cell.edge"
                  :edge-id="cell.edge.id"
                  v-slot="{ color, cursor, setHovered }"
                >
                  <Tooltip
                    :label="cellLabel(row.id, cell.id)"
                    :delay="400"
                  >
                    <template #trigger>
                      <td
                        :class="dataCellClass"
                        :style="{ backgroundColor: color, cursor }"
                        @click="focusEdge(cell.edge.id)"
                        @mouseenter="setHovered(true)"
                        @mouseleave="setHovered(false)"
                      >
                        <span class="block truncate">{{
                          cellText(row.id, cell.id)
                        }}</span>
                      </td>
                    </template>
                  </Tooltip>
                </TransitionMatrixCell>
                <td
                  v-else
                  :class="emptyCellClass"
                >
                  0
                </td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </VStack>
    <span
      v-else
      class="font-bold text-lg"
      >No nodes to display a transition matrix</span
    >
  </Well>
</template>
