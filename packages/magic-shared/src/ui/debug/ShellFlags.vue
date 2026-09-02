<script setup lang="ts">
  import { computed } from 'vue';

  import { useProvidedShell } from '../../product/context.ts';
  import DebugPanel from './shared/DebugPanel.vue';
  import DebugSection from './shared/DebugSection.vue';
  import DebugStatus from './shared/DebugStatus.vue';
  import { LABEL, VALUE } from './shared/classes.ts';

  const shell = useProvidedShell();

  /*
    resolution happens once at setup and nothing writes to the flags after, so this
    reads them straight rather than watching. iterating them keeps a flag added to
    ShellFlags on the panel without anyone remembering to list it here
  */
  const flags = computed(() =>
    Object.entries(shell.flags).map(([name, isOn]) => ({ name, isOn })),
  );

  const onCount = computed(() => flags.value.filter(({ isOn }) => isOn).length);
</script>

<template>
  <DebugPanel title="Shell Flags">
    <template #badge>
      <span :class="[VALUE, 'font-bold']">
        {{ onCount }}<span :class="LABEL">/{{ flags.length }}</span>
      </span>
    </template>

    <DebugSection>
      <DebugStatus
        v-for="{ name, isOn } of flags"
        :key="name"
        :label="name"
        :is-on="isOn"
      />
    </DebugSection>
  </DebugPanel>
</template>
