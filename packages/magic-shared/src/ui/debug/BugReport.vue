<script setup lang="ts">
  import { devWarning } from '@core/utils/debugging';
  import { mdiBugOutline, mdiCheck } from '@mdi/js';

  import { computed, onBeforeUnmount, ref } from 'vue';

  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedShell } from '../../product/context.ts';
  import { toast } from '../toast/index.ts';
  import { buildBugReport } from './bugReport.ts';
  import { PANEL, TITLE } from './shared/classes.ts';
  import { useRepaintSample } from './shared/useRepaintSample.ts';

  /** how long the button stands as its own confirmation before offering the copy again */
  const COPIED_FEEDBACK_MS = 3_000;

  const PROBLEM_TOAST_MS = 6_000;

  const ICON_PX = 14;

  const shell = useProvidedShell();

  // the one reading the shell does not hold: frame timing is only knowable by watching
  const { fps, frameMs } = useRepaintSample(shell.surface);

  const copied = ref(false);

  let copiedResetTimer: ReturnType<typeof setTimeout>;

  onBeforeUnmount(() => clearTimeout(copiedResetTimer));

  // awaited, because a clipboard the browser turns down rejects rather than throwing
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
      devWarning('debug: the clipboard turned down the bug report', err);
      toast.show({
        title: 'Could Not Copy The Report',
        description: 'Your browser turned down access to the clipboard.',
        severity: 'error',
        duration: PROBLEM_TOAST_MS,
      });
    }
  };

  const display = computed(() =>
    copied.value
      ? { text: 'Report Copied', icon: mdiCheck }
      : { text: 'Copy Bug Report', icon: mdiBugOutline },
  );
</script>

<template>
  <!-- a panel by its cover, since it stands in the same column as the readouts it copies -->
  <button
    type="button"
    class="w-full cursor-pointer"
    @click="copyReport"
  >
    <Well :class="[PANEL, 'hover:bg-gray-300 dark:hover:bg-gray-700']">
      <HStack class="justify-between">
        <span :class="TITLE">{{ display.text }}</span>
        <Icon
          :path="display.icon"
          :size="ICON_PX"
        />
      </HStack>
    </Well>
  </button>
</template>
