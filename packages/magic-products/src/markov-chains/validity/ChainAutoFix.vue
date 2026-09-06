<script setup lang="ts">
  import IconVue from '@magic/shared/Icon';
  import ThemerButton from '@magic/shared/ThemerButton';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import { mdiAutoFix } from '@mdi/js';

  import { useMarkovChain } from '../useMarkovChain.ts';
  import { useChainAutoFix } from './useChainAutoFix.ts';

  const graph = useProvidedGraph();
  const chain = useMarkovChain(graph);

  const autoFix = useChainAutoFix(graph, chain);
</script>

<template>
  <Well
    v-if="!chain.isValid.value"
    class="p-0"
  >
    <ThemerButton
      @click="autoFix.apply"
      :themer="autoFix.themer"
      class="bg-transparent dark:bg-transparent"
    >
      <template #start>
        <IconVue :path="mdiAutoFix" />
      </template>
      Auto Fix Chain
    </ThemerButton>
  </Well>
</template>
