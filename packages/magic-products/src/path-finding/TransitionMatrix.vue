<script setup lang="ts">
  import Node from '@magic/shared/Node';
  import Tooltip from '@magic/shared/Tooltip';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/graph-product';

  import { computed } from 'vue';

  import TransitionMatrixCell from './TransitionMatrixCell.vue';

  const graph = useProvidedGraph();

  const nodeIds = computed(() => graph.nodes.value.map((node) => node.id));

  const labelOf = (id: string) => graph.getNode(id).label;

  const indexOfId = computed(() => {
    const map = new Map<string, number>();
    nodeIds.value.forEach((id, index) => map.set(id, index));
    return map;
  });

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

  const displayedNodeIds = computed(() =>
    [...nodeIds.value].sort((a, b) => labelOf(a).localeCompare(labelOf(b))),
  );

  const matrixRows = computed(() =>
    displayedNodeIds.value.map((fromId) => ({
      id: fromId,
      cells: displayedNodeIds.value.map((toId) => ({
        id: toId,
        edgeId: edgeIdFor(fromId, toId),
      })),
    })),
  );

  const cellLabel = (fromId: string, toId: string) =>
    `${labelOf(fromId)}→${labelOf(toId)}`;

  const cellText = (fromId: string, toId: string) => {
    if (!hasEdge(fromId, toId)) return '';
    const fromIndex = indexOfId.value.get(fromId)!;
    const toIndex = indexOfId.value.get(toId)!;
    return graph.transitionMatrix.value[fromIndex][toIndex].toFraction();
  };

  const successorsOf = (id: string) =>
    nodeIds.value.filter((otherId) => otherId !== id && hasEdge(id, otherId));

  const predecessorsOf = (id: string) =>
    nodeIds.value.filter((otherId) => otherId !== id && hasEdge(otherId, id));

  const focusFromState = (id: string) =>
    graph.focus.set([
      id,
      ...successorsOf(id).map((otherId) => edgeIdFor(id, otherId)!),
    ]);

  const focusToState = (id: string) =>
    graph.focus.set([
      id,
      ...predecessorsOf(id).map((otherId) => edgeIdFor(otherId, id)!),
    ]);

  const density = computed(() => {
    const count = graph.nodes.value.length;
    if (count > 10) return { cellSize: 8, nodeScale: 0.5 };
    if (count > 5) return { cellSize: 10, nodeScale: 0.625 };
    return { cellSize: 12, nodeScale: 0.75 };
  });

  const sizeClasses: Record<number, string> = {
    8: 'size-8',
    10: 'size-10',
    12: 'size-12',
  };
  const dataCellSizeClasses: Record<number, string> = {
    8: 'size-8 max-w-8',
    10: 'size-10 max-w-10',
    12: 'size-12 max-w-12',
  };

  const headerCellClass = computed(() => sizeClasses[density.value.cellSize]);
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
  <Well v-if="nodeIds.length > 0">
    <VStack class="gap-2">
      <div class="max-h-[50vh] max-w-[40vw] overflow-auto">
        <table class="table-fixed border-separate border-spacing-1">
          <thead>
            <tr>
              <th :class="headerCellClass"></th>
              <th
                v-for="toId in displayedNodeIds"
                :key="toId"
                :class="headerCellClass"
                @click="focusToState(toId)"
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
                @click="focusFromState(row.id)"
              >
                <Node
                  :id="row.id"
                  :scale="density.nodeScale"
                />
              </th>
              <template
                v-for="cell in row.cells"
                :key="`${row.id}::${cell.edgeId ?? 'none'}`"
              >
                <TransitionMatrixCell
                  v-if="cell.edgeId"
                  :edge-id="cell.edgeId"
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
                        @click="focusEdge(row.id, cell.id)"
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
  </Well>
</template>
