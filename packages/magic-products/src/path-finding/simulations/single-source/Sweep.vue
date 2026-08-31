<script setup lang="ts">
  import Edge from '@magic/shared/Edge';
  import HStack from '@magic/shared/HStack';
  import Icon from '@magic/shared/Icon';
  import Node from '@magic/shared/Node';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { GEdge } from '@magic/shared/graph';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import { useCurrentFrame } from '@magic/shared/simulation';
  import { edgeRoleColors } from '@magic/shared/theme';
  import { mdiArrowDown, mdiClose, mdiMinus } from '@mdi/js';

  import { computed, nextTick, ref, watch } from 'vue';

  import { edgeRoles } from './effects.ts';
  import { SingleSourceFrame, SweepOutcome } from './frame.ts';

  const graph = useProvidedGraph();

  const currentFrame = useCurrentFrame<SingleSourceFrame>();
  const sweep = computed(() => currentFrame.value?.sweep);

  const title = computed(() => {
    const underway = sweep.value;
    if (!underway) return '';
    if (underway.pass === undefined) return 'Final Sweep';
    return `Sweep ${underway.pass} of ${underway.totalPasses}`;
  });
  const OUTCOMES = {
    improved: {
      path: mdiArrowDown,
      color: edgeRoleColors[edgeRoles.shortestPath],
      title: 'Improved a distance',
    },
    kept: {
      path: mdiMinus,
      color: edgeRoleColors[edgeRoles.discarded],
      title: 'Offered nothing cheaper',
    },
    skipped: {
      path: mdiClose,
      color: edgeRoleColors[edgeRoles.discarded],
      title: 'Nothing had reached it to cross from',
    },
  } as const;

  const edgeIds = computed<readonly GEdge['id'][]>(
    () => sweep.value?.edgeIds ?? [],
  );

  const rows = computed(() =>
    edgeIds.value.map((id, index) => {
      const edge = graph.getEdge(id);
      const outcome: SweepOutcome | undefined = sweep.value?.outcomes[id];
      return {
        id,
        source: edge.source,
        target: edge.target,
        at: index + 1,
        outcome: outcome ? OUTCOMES[outcome] : undefined,
      };
    }),
  );

  const column = ref<HTMLElement>();

  watch(
    () => sweep.value?.position,
    async (at) => {
      if (!at) return;
      await nextTick();
      column.value
        ?.querySelector(`[data-sweep-position="${at}"]`)
        ?.scrollIntoView({ block: 'nearest' });
    },
  );

  const rowClass = (at: number) =>
    'justify-between rounded-md ' +
    (at === sweep.value?.position
      ? 'bg-amber-500/15 ring-2 ring-amber-500 p-1'
      : 'm-1');
</script>

<template>
  <Well v-if="rows.length > 0">
    <VStack class="gap-2">
      <span class="text-lg font-bold text-center">{{ title }}</span>
      <!--
        a plain element rather than a VStack, because the scroll has to reach
        the node itself to find the row it is scrolling to
      -->
      <div
        ref="column"
        class="flex flex-col gap-2 max-h-[38vh] overflow-y-auto p-1"
      >
        <HStack
          v-for="row in rows"
          :key="row.at"
          :data-sweep-position="row.at"
          :class="rowClass(row.at)"
        >
          <Node
            :id="row.source"
            :scale="0.75"
            class="z-1"
          />
          <Edge
            :id="row.id"
            :width="24"
            class="-mx-4"
          />
          <Node
            :id="row.target"
            :scale="0.75"
            class="z-1"
          />
          <div class="w-5 shrink-0 flex justify-center">
            <Icon
              v-if="row.outcome"
              :path="row.outcome.path"
              :size="18"
              :style="{ color: row.outcome.color }"
            >
              <title>{{ row.outcome.title }}</title>
            </Icon>
          </div>
        </HStack>
      </div>
    </VStack>
  </Well>
</template>
