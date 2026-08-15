<script setup lang="ts">
  import Node from '@magic/shared/Node';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { GNode } from '@magic/shared/graph';
  import { useProvidedGraph } from '@magic/shared/graph-product';
  import { useCurrentFrame } from '@magic/shared/simulation';
  import { nodeRoleColors } from '@magic/shared/theme';

  import { computed } from 'vue';

  import { formatDistance } from '../distance.ts';
  import { nodeRoles } from './effects.ts';
  import { AllPairsFrame } from './frame.ts';

  const graph = useProvidedGraph();

  const currentFrame = useCurrentFrame<AllPairsFrame>();

  const matrix = computed(() => currentFrame.value?.matrix);

  const nodeIds = computed(() => {
    const rows = matrix.value;
    if (!rows) return [];
    return graph.nodes.value.map((node) => node.id).filter((id) => id in rows);
  });

  /*
    which cell the algorithm is looking at, read off the frame type rather than
    carried in the payload. the pair belongs to the steps that have one, so
    spelling it out here keeps it from becoming a field every other frame has to
    leave undefined
  */
  const focus = computed<{
    pivot?: GNode['id'];
    from?: GNode['id'];
    to?: GNode['id'];
  }>(() => {
    const frame = currentFrame.value;
    if (!frame) return {};
    if (frame.type === 'choose-pivot') return { pivot: frame.node };
    const isPair =
      frame.type === 'consider-pair' ||
      frame.type === 'improve-pair' ||
      frame.type === 'keep-pair';
    if (isPair) return { pivot: frame.pivot, from: frame.from, to: frame.to };
    return {};
  });

  // the same hues the canvas paints the roles with, so the table and the graph
  // agree on what is being looked at. the alpha suffix keeps the text readable
  const PIVOT_TINT = nodeRoleColors[nodeRoles.pivot] + '33';
  const PAIR_TINT = nodeRoleColors[nodeRoles.pair] + '66';

  const cellTint = (from: GNode['id'], to: GNode['id']) => {
    const { pivot, from: focusFrom, to: focusTo } = focus.value;
    if (from === focusFrom && to === focusTo) return PAIR_TINT;
    if (from === pivot || to === pivot) return PIVOT_TINT;
  };
</script>

<template>
  <Well v-if="nodeIds.length > 0">
    <VStack class="gap-2">
      <span class="text-sm font-bold opacity-60">From \ To</span>
      <div class="max-h-[50vh] max-w-[40vw] overflow-auto">
        <table class="border-separate border-spacing-1">
          <thead>
            <tr>
              <th></th>
              <th
                v-for="to in nodeIds"
                :key="to"
              >
                <Node
                  :id="to"
                  :scale="0.45"
                />
              </th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="from in nodeIds"
              :key="from"
            >
              <th>
                <Node
                  :id="from"
                  :scale="0.45"
                />
              </th>
              <td
                v-for="to in nodeIds"
                :key="to"
                class="rounded-sm px-2 text-center font-bold tabular-nums"
                :style="{ backgroundColor: cellTint(from, to) }"
              >
                {{ formatDistance(matrix?.[from]?.[to]) }}
              </td>
            </tr>
          </tbody>
        </table>
      </div>
    </VStack>
  </Well>
</template>
