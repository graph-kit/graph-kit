<script setup lang="ts">
  import Node from '@magic/shared/Node';
  import TruncatedText from '@magic/shared/TruncatedText';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { GEdge, GNode } from '@magic/shared/graph';
  import { useProvidedGraph } from '@magic/shared/graph-shell';

  import { computed } from 'vue';

  import AdjacencyMatrixCell from './AdjacencyMatrixCell.vue';
  import { useAdjacencyMatrixGrid } from './composables/useAdjacencyMatrixGrid.ts';
  import { useMatrixDensity } from './composables/useMatrixDensity.ts';

  const graph = useProvidedGraph();

  const { nodeIds, grid } = useAdjacencyMatrixGrid(graph);

  const labelOf = (id: GNode['id']) => graph.getNode(id).label;

  const matrixRows = computed(() =>
    nodeIds.value.map((sourceId, sourceIndex) => ({
      id: sourceId,
      sourceIndex: sourceIndex,
      cells: nodeIds.value.map((targetId, targetIndex) => ({
        id: targetId,
        edge: grid.value[sourceIndex][targetIndex],
      })),
    })),
  );

  const cellLabel = (sourceId: GNode['id'], targetId: GNode['id']) =>
    `${labelOf(sourceId)}→${labelOf(targetId)}`;

  const cellText = (edgeId: GEdge['id']) =>
    graph.getEdge(edgeId).weight.toFraction();

  const cellTooltip = (
    sourceId: GNode['id'],
    targetId: GNode['id'],
    edgeId: GEdge['id'],
  ) => `${cellLabel(sourceId, targetId)}: ${cellText(edgeId)}`;

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

  const density = useMatrixDensity(() => graph.nodes.value.length);

  const headerCellClass = computed(() => density.value.headerClass);
  const columnHeaderCellClass = computed(
    () =>
      `${headerCellClass.value} sticky top-0 z-10 bg-gray-200 dark:bg-gray-800`,
  );
  const emptyCellClass = computed(
    () =>
      `${density.value.dataClass} overflow-hidden rounded-sm bg-gray-500/20 text-center font-bold opacity-40`,
  );
  const dataCellClass = computed(
    () => `${density.value.dataClass} relative overflow-hidden p-0`,
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
                v-for="(targetId, targetIndex) in nodeIds"
                :key="targetId"
                :class="columnHeaderCellClass"
                @click="focusTargetNodeAndInboundEdges(targetId, targetIndex)"
              >
                <Node
                  :id="targetId"
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
                @click="
                  focusSourceNodeAndOutboundEdges(row.id, row.sourceIndex)
                "
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
                <AdjacencyMatrixCell
                  v-if="cell.edge"
                  :edge-id="cell.edge.id"
                  v-slot="{ color, cursor }"
                >
                  <td :class="dataCellClass">
                    <button
                      type="button"
                      class="absolute inset-0 grid place-items-center rounded-sm text-center font-bold text-white tabular-nums"
                      :style="{ backgroundColor: color, cursor }"
                      @click="graph.focus.set([cell.edge.id])"
                    >
                      <TruncatedText
                        class="block w-full px-1"
                        :tooltip="cellTooltip(row.id, cell.id, cell.edge.id)"
                        :delay="400"
                      >
                        {{ cellText(cell.edge.id) }}
                      </TruncatedText>
                    </button>
                  </td>
                </AdjacencyMatrixCell>
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
      >Add Nodes For Adjacency Matrix</span
    >
  </Well>
</template>
