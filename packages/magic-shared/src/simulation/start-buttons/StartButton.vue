<script setup lang="ts">
  import { mdiAlert, mdiPlay } from '@mdi/js';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import { useProvidedMagic } from '../../product/context.ts';
  import { SimulationDefinition } from '../types.ts';

  defineProps<{
    definition: SimulationDefinition<any> | undefined;
    disabled: string | false;
  }>();

  const magic = useProvidedMagic();
</script>

<template>
  <Button
    v-if="definition"
    :disabled="disabled"
    @click="magic.simulation.start(definition)"
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
