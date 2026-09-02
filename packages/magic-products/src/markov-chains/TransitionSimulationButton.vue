<script setup lang="ts">
  import Button from '@magic/shared/Button';
  import Dropdown from '@magic/shared/Dropdown';
  import HStack from '@magic/shared/HStack';
  import Icon from '@magic/shared/Icon';
  import NodeVue from '@magic/shared/Node';
  import SwitchVue from '@magic/shared/Switch';
  import TextInput from '@magic/shared/TextInput';
  import Tooltip from '@magic/shared/Tooltip';
  import VStack from '@magic/shared/VStack';
  import Well from '@magic/shared/Well';
  import { useProvidedGraph } from '@magic/shared/graph-shell';
  import { useProvidedShell } from '@magic/shared/product';
  import { mdiPlay } from '@mdi/js';
  import Fraction from 'fraction.js';

  import { computed, ref, shallowRef } from 'vue';

  import { definitions } from './definitions.ts';
  import { distributionSimulationDefinition } from './simulations/useDistributionSimulation.ts';
  import { useMarkovChain } from './useMarkovChain.ts';

  const graph = useProvidedGraph();
  const shell = useProvidedShell();
  const chain = useMarkovChain(graph);

  const stepDisabled = computed(() => {
    if (graph.nodes.value.length === 0) return 'Needs at least one state.';
    if (!chain.isValid.value)
      return `Needs a valid chain. ${definitions.validity}`;
    return false;
  });

  const startingDistribution = shallowRef<Fraction[]>([]);
  const simplify = ref(true);
  const definition = distributionSimulationDefinition(
    graph,
    startingDistribution,
    simplify,
  );

  const initRawInput = () => graph.nodes.value.map((_) => '');

  const rawInput = ref(initRawInput());

  graph.events.subscribe(
    'onNodesAdded',
    () => (rawInput.value = initRawInput()),
  );
  graph.events.subscribe(
    'onNodesRemoved',
    () => (rawInput.value = initRawInput()),
  );

  const cleanedInput = (rawInput: string) => {
    const trimmed = rawInput.trim();
    // a state left blank is one the distribution never starts in
    if (trimmed === '') return new Fraction(0);

    // fraction throws on input it cannot read and on divide by zero
    try {
      const probability = new Fraction(trimmed);
      const outOfRange = probability.lt(0) || probability.gt(1);
      return outOfRange ? undefined : probability;
    } catch {}
  };

  const invalidInputMessage = (rawInput: string) => {
    if (cleanedInput(rawInput) !== undefined) return;
    return 'Must be between 0 and 1';
  };

  const parsedInput = computed(() => {
    const distribution: Fraction[] = [];
    for (const input of rawInput.value) {
      const probability = cleanedInput(input);
      if (probability === undefined) return;
      distribution.push(probability);
    }
    return distribution;
  });

  const parsedInputInvalid = computed(() => {
    const distribution = parsedInput.value;
    if (!distribution) return 'Some states have an invalid probability';

    const total = distribution.reduce(
      (sum, probability) => sum.add(probability),
      new Fraction(0),
    );
    if (!total.equals(1)) {
      return 'Probabilities must sum to 1';
    }

    return false;
  });

  const start = () => {
    const distribution = parsedInput.value;
    if (!distribution || parsedInputInvalid.value) return;
    startingDistribution.value = distribution;
    shell.simulation.start(definition);
  };
</script>

<template>
  <Dropdown align="center">
    <template #trigger>
      <Button :disabled="stepDisabled">
        <template #start>
          <Icon :path="mdiPlay" />
        </template>
        Step The Distribution
      </Button>
    </template>
    <Well>
      <VStack>
        <div class="font-bold text-xl mb-2">Starting Distribution</div>
        <HStack class="flex-wrap max-w-100">
          <HStack
            v-for="(node, i) in graph.nodes.value"
            :key="node.id"
          >
            <NodeVue
              :id="node.id"
              :scale="0.5"
            />
            <Tooltip :label="invalidInputMessage(rawInput[i])">
              <template #trigger>
                <TextInput
                  v-model="rawInput[i]"
                  @keyup.enter="start"
                  :invalid="cleanedInput(rawInput[i]) === undefined"
                  inputmode="numeric"
                  placeholder="0"
                  class="w-10 px-1 py-0.5 text-center"
                />
              </template>
            </Tooltip>
          </HStack>
        </HStack>

        <HStack class="justify-between">
          <Button
            @click="start"
            :disabled="parsedInputInvalid"
            class="mt-2"
          >
            <template #start>
              <Icon :path="mdiPlay" />
            </template>
            Start
          </Button>
          <Tooltip label="Simplify each state to the nearest 100th">
            <template #trigger>
              <HStack class="items-center gap-2 mt-3 text-sm">
                <SwitchVue v-model="simplify" />
                <span class="font-bold">Simplify</span>
              </HStack>
            </template>
          </Tooltip>
        </HStack>
      </VStack>
    </Well>
  </Dropdown>
</template>
