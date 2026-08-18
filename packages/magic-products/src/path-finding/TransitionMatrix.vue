<script setup lang="ts">
  import Node from '@magic/shared/Node';
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

  // alphabetical by the node's displayed label rather than its (random,
  // meaningless) id
  const displayOrder = computed(() =>
    nodeIds.value
      .map((_, index) => index)
      .sort((a, b) =>
        labelOf(nodeIds.value[a]).localeCompare(labelOf(nodeIds.value[b])),
      ),
  );

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
    graph.focus.set([
      id,
      ...successorsOf(id).map((otherId) => edgeIdFor(id, otherId)!),
    ]);

  const focusToState = (id: string) =>
    graph.focus.set([
      id,
      ...predecessorsOf(id).map((otherId) => edgeIdFor(otherId, id)!),
    ]);

  const cellSize = computed(() => {
    return graph.nodes.value.length > 5
      ? graph.nodes.value.length > 10
        ? 8
        : 10
      : 12;
  });
  const nodeScale = computed(() => {
    return graph.nodes.value.length > 5
      ? graph.nodes.value.length > 10
        ? 0.5
        : 0.625
      : 0.75;
  });
</script>

<template>
  <Well v-if="nodeIds.length > 0">
    <VStack class="gap-2">
      <div class="max-h-[50vh] max-w-[40vw] overflow-auto">
        <table class="table-fixed border-separate border-spacing-1">
          <thead>
            <tr>
              <th :class="`size-${cellSize}`"></th>
              <th
                v-for="toIndex in displayOrder"
                :key="nodeIds[toIndex]"
                :class="`size-${cellSize}`"
                @click="focusToState(nodeIds[toIndex])"
              >
                <Node
                  :id="nodeIds[toIndex]"
                  :scale="nodeScale"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="fromIndex in displayOrder"
              :key="nodeIds[fromIndex]"
            >
              <th
                :class="`size-${cellSize}`"
                @click="focusFromState(nodeIds[fromIndex])"
              >
                <Node
                  :id="nodeIds[fromIndex]"
                  :scale="nodeScale"
                />
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
                    :class="`size-${cellSize} max-w-12 overflow-hidden rounded-sm px-1 text-center font-bold text-white tabular-nums`"
                    :style="{ backgroundColor: color, cursor }"
                    @click="focusEdge(nodeIds[fromIndex], nodeIds[toIndex])"
                  >
                    <span class="block truncate">{{
                      cellText(nodeIds[fromIndex], nodeIds[toIndex])
                    }}</span>
                  </td>
                </TransitionMatrixCell>
                <td
                  v-else
                  :class="`size-${cellSize} rounded-sm bg-gray-500/20`"
                ></td>
              </template>
            </tr>
          </tbody>
        </table>
      </div>
    </VStack>
  </Well>
</template>
