<script setup lang="ts">
  import ToolTip from '@core/components/Tooltip';
  import { nullThrows } from '@core/utils/assert';
  import HStack from '@magic/shared/HStack';
  import Node from '@magic/shared/Node';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/graph-product';

  import { computed } from 'vue';

  import AdjacencyListCell from './AdjacencyListCell.vue';

  const graph = useProvidedGraph();

  const adjacencyList = computed(() => graph.adjacencyLists.standard.value);

  const nodeIds = computed(() => graph.nodes.value.map((node) => node.id));

  const labelOf = (id: string) => graph.getNode(id).label;

  const edgeIdBetween = (fromId: string, toId: string) =>
    nullThrows(
      graph.helpers.nodes.getEdgeBetween(fromId, toId),
      `no edge between ${fromId} and ${toId}`,
    ).id;

  const focusNode = (id: string) => {
    const outgoingEdgeIds = (adjacencyList.value[id] ?? []).map((targetId) =>
      edgeIdBetween(id, targetId),
    );
    graph.focus.set([id, ...outgoingEdgeIds]);
  };
  const focusEdge = (edgeId: string, nodeId: string) =>
    graph.focus.set([edgeId, nodeId]);

  const edgeWeightLabel = (fromId: string, edgeId: string, toId: string) =>
    `${labelOf(fromId)}→${labelOf(toId)}: ${graph.getEdge(edgeId).weight.toFraction()}`;

  const noSuccessorsLabel = (fromId: string) =>
    `${labelOf(fromId)} doesn't point to any nodes`;
</script>

<template>
  <Well v-if="nodeIds.length > 0">
    <div class="max-h-[50vh] max-w-[40vw] overflow-auto">
      <VStack class="gap-2">
        <HStack
          v-for="(successorIds, fromId) in adjacencyList"
          :key="fromId"
          class="items-center gap-2"
        >
          <div
            class="shrink-0 cursor-pointer"
            @click="focusNode(fromId)"
          >
            <Node
              :id="fromId"
              :scale="0.75"
            />
          </div>

          <span class="font-bold">&rarr;</span>

          <HStack
            v-if="successorIds.length > 0"
            class="flex-wrap items-center"
          >
            <AdjacencyListCell
              v-for="targetId in successorIds"
              :key="edgeIdBetween(fromId, targetId)"
              :edge-id="edgeIdBetween(fromId, targetId)"
            >
              <ToolTip
                :label="
                  edgeWeightLabel(
                    fromId,
                    edgeIdBetween(fromId, targetId),
                    targetId,
                  )
                "
              >
                <template #trigger>
                  <Node
                    @click="
                      focusEdge(edgeIdBetween(fromId, targetId), targetId)
                    "
                    :id="targetId"
                    :scale="0.75"
                  />
                </template>
              </ToolTip>
            </AdjacencyListCell>
          </HStack>
          <ToolTip
            v-else
            :label="noSuccessorsLabel(fromId)"
          >
            <template #trigger>
              <span class="font-bold text-lg">None</span>
            </template>
          </ToolTip>
        </HStack>
      </VStack>
    </div>
  </Well>
</template>
