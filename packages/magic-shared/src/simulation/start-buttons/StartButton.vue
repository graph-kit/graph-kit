<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import { mdiAlert, mdiPlay } from '@mdi/js';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import { DisabledLens } from '../../lens/types.ts';
  import { useProvidedShell } from '../../product/context.ts';
  import DisabledLensButton from '../../ui/disabled-lens-button/DisabledLensButton.vue';
  import { SimulationDefinition } from '../types.ts';

  const props = defineProps<{
    definition: SimulationDefinition<any> | undefined;
    name: string | undefined;
    disabled: DisabledLens | false;
    beforeStarting?: () => void;
  }>();

  const shell = useProvidedShell();

  const start = () => {
    props.beforeStarting?.();
    shell.simulation.start(
      nullThrows(props.definition, 'no definition provided'),
    );
  };
</script>

<template>
  <DisabledLensButton
    v-if="definition && name"
    :disabled="disabled"
    @click="start"
  >
    <template #start>
      <Icon :path="mdiPlay" />
    </template>
    {{ name }}
  </DisabledLensButton>
  <Button
    v-else
    disabled="This button cannot function due to a developer error in the configuration of this experience"
    class="bg-red-500 dark:bg-red-500"
  >
    <template #start>
      <Icon :path="mdiAlert" />
    </template>
    Unavailable
  </Button>
</template>
