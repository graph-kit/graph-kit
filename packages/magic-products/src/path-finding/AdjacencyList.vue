<script setup lang="ts">
  import ToolTip from '@core/components/Tooltip';
  import HStack from '@magic/shared/HStack';
  import Node from '@magic/shared/Node';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/graph-product';

  import { computed } from 'vue';

  import AdjacencyListCell from './AdjacencyListCell.vue';

  const graph = useProvidedGraph();

  const nodeIds = computed(() => graph.nodes.value.map((node) => node.id));

  const labelOf = (id: string) => graph.getNode(id).label;

  const displayedNodeIds = computed(() =>
    [...nodeIds.value].sort((a, b) => labelOf(a).localeCompare(labelOf(b))),
  );

  const successorsOf = (id: string) =>
    graph.edges.value
      .filter((edge) => edge.source === id)
      .map((edge) => ({ edgeId: edge.id, targetId: edge.target }))
      .sort((a, b) => labelOf(a.targetId).localeCompare(labelOf(b.targetId)));

  const adjacencyList = computed(() =>
    displayedNodeIds.value.map((id) => ({
      id,
      successors: successorsOf(id),
    })),
  );

  const focusNode = (id: string) => graph.focus.set([id]);
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
          v-for="fromNode in adjacencyList"
          :key="fromNode.id"
          class="items-center gap-2"
        >
          <div
            class="shrink-0 cursor-pointer"
            @click="focusNode(fromNode.id)"
          >
            <Node
              :id="fromNode.id"
              :scale="0.75"
            />
          </div>

          <span class="font-bold">&rarr;</span>

          <HStack
            v-if="fromNode.successors.length > 0"
            class="flex-wrap items-center gap-1.5"
          >
            <AdjacencyListCell
              v-for="successor in fromNode.successors"
              :key="successor.edgeId"
              :edge-id="successor.edgeId"
            >
              <ToolTip
                :label="
                  edgeWeightLabel(
                    fromNode.id,
                    successor.edgeId,
                    successor.targetId,
                  )
                "
              >
                <template #trigger>
                  <Node
                    @click="focusEdge(successor.edgeId, successor.targetId)"
                    :id="successor.targetId"
                    :scale="0.75"
                  />
                </template>
              </ToolTip>
            </AdjacencyListCell>
          </HStack>
          <ToolTip
            v-else
            :label="noSuccessorsLabel(fromNode.id)"
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
