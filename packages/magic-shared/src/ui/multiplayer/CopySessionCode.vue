<script setup lang="ts">
  import { devWarning } from '@core/utils/debugging';
  import { mdiCheck, mdiClipboard, mdiContentCopy } from '@mdi/js';

  import { computed, ref } from 'vue';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';
  import { toast } from '../toast/index.ts';

  const { room } = useConnectedMultiplayer();

  // 3 seconds of code copied confirmation state
  const CODE_COPIED_FEEDBACK_DURATION_MS = 3_000;

  const COPY_FAILED_TOAST_MS = 6_000;

  let codeCopiedResetTimer: NodeJS.Timeout;

  const codeCopiedToClipboard = ref(false);

  const sessionCode = computed(() => room.value.id.toUpperCase());

  const copyCodeToClipboard = async () => {
    clearTimeout(codeCopiedResetTimer);
    try {
      await navigator.clipboard.writeText(sessionCode.value);
      codeCopiedToClipboard.value = true;
      codeCopiedResetTimer = setTimeout(
        () => (codeCopiedToClipboard.value = false),
        CODE_COPIED_FEEDBACK_DURATION_MS,
      );
    } catch (err) {
      devWarning(
        'multiplayer: the clipboard turned down the session code',
        err,
      );
      toast.show({
        title: 'Could Not Copy The Session Code',
        description: `Your browser turned down access to the clipboard. The code is ${sessionCode.value}.`,
        severity: 'error',
        duration: COPY_FAILED_TOAST_MS,
      });
    }
  };

  const display = computed(() => {
    return codeCopiedToClipboard.value
      ? { text: 'Session Code Copied', icon: mdiCheck }
      : {
          text: `Copy Session Code ${sessionCode.value}`,
          icon: mdiContentCopy,
        };
  });
</script>

<template>
  <Button @click="copyCodeToClipboard">
    <template #start>
      <Icon :path="display.icon" />
    </template>
    {{ display.text }}
  </Button>
</template>
