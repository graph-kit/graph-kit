<script setup lang="ts">
  import { devWarning } from '@core/utils/debugging';
  import { mdiBugOutline, mdiCheck } from '@mdi/js';

  import { computed, onBeforeUnmount, ref } from 'vue';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedShell } from '../../product/context.ts';
  import { toast } from '../toast/index.ts';
  import { buildBugReport } from './bugReport.ts';
  import { useRepaintSample } from './shared/useRepaintSample.ts';

  const COPIED_FEEDBACK_MS = 3_000;

  const PROBLEM_TOAST_MS = 6_000;

  const shell = useProvidedShell();

  const { fps, frameMs } = useRepaintSample(shell.surface);

  const copied = ref(false);

  let copiedResetTimer: ReturnType<typeof setTimeout>;

  onBeforeUnmount(() => clearTimeout(copiedResetTimer));

  const copyReport = async () => {
    clearTimeout(copiedResetTimer);

    const report = buildBugReport(shell, {
      fps: fps.value,
      frameMs: frameMs.value,
    });

    try {
      await navigator.clipboard.writeText(report);
      copied.value = true;
      copiedResetTimer = setTimeout(
        () => (copied.value = false),
        COPIED_FEEDBACK_MS,
      );
    } catch (err) {
      toast.show({
        title: 'Report Not Copied',
        description: 'Your browser turned down access to the clipboard.',
        severity: 'error',
        duration: PROBLEM_TOAST_MS,
      });
    }
  };

  const display = computed(() =>
    copied.value
      ? { text: 'Copied Debug Info', icon: mdiCheck }
      : { text: 'Copy Debug Info', icon: mdiBugOutline },
  );
</script>

<template>
  <Well>
    <Button @click="copyReport">
      <template #start>
        <Icon :path="display.icon" />
      </template>
      {{ display.text }}
    </Button>
  </Well>
</template>
