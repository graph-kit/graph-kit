<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import HStack from '@magic/shared/HStack';
  import Icon from '@magic/shared/Icon';
  import Node from '@magic/shared/Node';
  import ToolTip from '@magic/shared/Tooltip';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/graph-product';
  import { mdiArrowRight } from '@mdi/js';

  const graph = useProvidedGraph();

  const adjacencyList = graph.adjacencyLists.standard;

  const labelOf = (id: string) => graph.getNode(id).label;

  const edgeIdBetween = (sourceId: string, targetId: string) =>
    nullThrows(
      graph.helpers.nodes.getEdgeBetween(sourceId, targetId),
      `no edge between ${sourceId} and ${targetId}`,
    ).id;

  const focusNode = (id: string) => {
    const outgoingEdgeIds = (adjacencyList.value[id] ?? []).map((targetId) =>
      edgeIdBetween(id, targetId),
    );
    graph.focus.set([id, ...outgoingEdgeIds]);
  };
  const focusEdge = (edgeId: string, nodeId: string) =>
    graph.focus.set([edgeId, nodeId]);

  const edgeWeightLabel = (
    edgeId: string,
    sourceId: string,
    targetId: string,
  ) =>
    `Edge ${labelOf(sourceId)}${labelOf(targetId)} costs ${graph.getEdge(edgeId).weight.toFraction()}`;

  const noTargetsLabel = (sourceId: string) =>
    `Node ${labelOf(sourceId)} doesn't have any outgoing edges`;
</script>

<template>
  <Well>
    <div class="max-h-[50vh] max-w-97 overflow-auto">
      <VStack v-if="graph.nodes.value.length > 0">
        <HStack
          v-for="(targetIds, fromId) in adjacencyList"
          :key="fromId"
        >
          <div
            class="shrink-0"
            @click="focusNode(fromId)"
          >
            <Node
              :id="fromId"
              :scale="0.75"
            />
          </div>

          <Icon
            :path="mdiArrowRight"
            class="shrink-0"
          ></Icon>

          <HStack
            v-if="targetIds.length > 0"
            class="flex-wrap"
          >
            <ToolTip
              v-for="targetId in targetIds"
              :key="edgeIdBetween(fromId, targetId)"
              :label="
                edgeWeightLabel(
                  edgeIdBetween(fromId, targetId),
                  fromId,
                  targetId,
                )
              "
            >
              <template #trigger>
                <Node
                  @click="focusEdge(edgeIdBetween(fromId, targetId), targetId)"
                  :id="targetId"
                  :scale="0.75"
                />
              </template>
            </ToolTip>
          </HStack>
          <ToolTip
            v-else
            :label="noTargetsLabel(fromId)"
          >
            <template #trigger>
              <span class="font-bold text-lg">None</span>
            </template>
          </ToolTip>
        </HStack>
      </VStack>
      <span
        v-else
        class="font-bold text-lg"
        >No nodes to display an adjacency list</span
      >
    </div>
  </Well>
</template>
