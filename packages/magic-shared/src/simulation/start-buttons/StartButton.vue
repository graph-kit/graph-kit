<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import { mdiAlert, mdiPlay } from '@mdi/js';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import { useProvidedMagic } from '../../product/context.ts';
  import { SimulationDefinition } from '../types.ts';

  const props = defineProps<{
    definition: SimulationDefinition<any> | undefined;
    disabled: string | false;
    beforeStarting?: () => void;
  }>();

  const magic = useProvidedMagic();

  const start = () => {
    props.beforeStarting?.();
    magic.simulation.start(
      nullThrows(props.definition, 'no definition provided'),
    );
  };
</script>

<template>
  <Button
    v-if="definition"
    :disabled="disabled"
    @click="start"
  >
    <template #start>
      <Icon :path="mdiPlay" />
    </template>
    {{ definition.name }}
  </Button>
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
