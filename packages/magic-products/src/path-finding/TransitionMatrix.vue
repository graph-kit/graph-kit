<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
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
    nodeIds.value.map((sourceId, sourceIndex) => ({
      id: sourceId,
      fromIndex: sourceIndex,
      cells: nodeIds.value.map((targetId, targetIndex) => ({
        id: targetId,
        edge: grid.value[sourceIndex][targetIndex],
      })),
    })),
  );

  const cellLabel = (sourceId: GNode['id'], targetId: GNode['id']) =>
    `${labelOf(sourceId)}→${labelOf(targetId)}`;

  const transitionMatrixIndexOf = computed(() => {
    const map = new Map<string, number>();
    graph.nodes.value.forEach((node, index) => map.set(node.id, index));
    return map;
  });

  const cellText = (sourceId: GNode['id'], targetId: GNode['id']) => {
    const targetIndex = nullThrows(
      transitionMatrixIndexOf.value.get(targetId),
      `no matrix index for node ${targetId}`,
    );
    const sourceIndex = nullThrows(
      transitionMatrixIndexOf.value.get(sourceId),
      `no matrix index for node ${sourceId}`,
    );
    return graph.transitionMatrix.value[sourceIndex][targetIndex].toFraction();
  };

  const focusEdge = (edgeId: string) => graph.focus.set([edgeId]);

  const focusSourceNodeAndOutboundEdges = (
    sourceId: GNode['id'],
    sourceIndex: number,
  ) => {
    const edgeIds = grid.value[sourceIndex]
      .map((edge, targetIndex) =>
        edge && nodeIds.value[targetIndex] !== sourceId ? edge.id : undefined,
      )
      .filter((id) => id !== undefined);
    graph.focus.set([sourceId, ...edgeIds]);
  };

  const focusTargetNodeAndInboundEdges = (
    targetId: GNode['id'],
    targetIndex: number,
  ) => {
    const edgeIds = grid.value
      .map((row, sourceIndex) =>
        row[targetIndex] && nodeIds.value[sourceIndex] !== targetId
          ? row[targetIndex].id
          : undefined,
      )
      .filter((id) => id !== undefined);
    graph.focus.set([targetId, ...edgeIds]);
  };

  type CellSize = 'xsmall' | 'small' | 'medium' | 'large';

  // TODO: handle overflow with component: https://github.com/graph-kit/graph-kit/issues/909
  const cellSizeConfig: Record<
    CellSize,
    { headerClass: string; dataClass: string; nodeScale: number }
  > = {
    xsmall: {
      headerClass: 'size-6 text-xs',
      dataClass: 'size-6 max-w-6 text-xs',
      nodeScale: 0.325,
    },
    small: {
      headerClass: 'size-8 text-sm',
      dataClass: 'size-8 max-w-8 text-sm',
      nodeScale: 0.5,
    },
    medium: {
      headerClass: 'size-10',
      dataClass: 'size-10 max-w-10',
      nodeScale: 0.625,
    },
    large: {
      headerClass: 'size-12',
      dataClass: 'size-12 max-w-12',
      nodeScale: 0.75,
    },
  };

  const density = computed(() => {
    const count = graph.nodes.value.length;
    const cellSize: CellSize =
      count > 12
        ? 'xsmall'
        : count > 7
          ? 'small'
          : count > 5
            ? 'medium'
            : 'large';
    return cellSizeConfig[cellSize];
  });

  const headerCellClass = computed(() => density.value.headerClass);
  const columnHeaderCellClass = computed(
    () =>
      `${headerCellClass.value} sticky top-0 z-10 bg-gray-200 dark:bg-gray-800`,
  );
  const emptyCellClass = computed(
    () =>
      `${density.value.headerClass} rounded-sm bg-gray-500/20 text-center font-bold opacity-40`,
  );
  const dataCellClass = computed(
    () =>
      `${density.value.dataClass} overflow-hidden rounded-sm text-center font-bold text-white tabular-nums`,
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
                @click="focusTargetNodeAndInboundEdges(toId, toIndex)"
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
                @click="focusSourceNodeAndOutboundEdges(row.id, row.fromIndex)"
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
                  v-slot="{ color, cursor }"
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
