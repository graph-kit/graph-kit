<script setup lang="ts">
  import { devWarning } from '@core/utils/debugging';
  import { mdiLink } from '@mdi/js';

  import MenuItem from '../../components/dropdown/MenuItem.vue';
  import { useProvidedShell } from '../../product/context.ts';
  import { toast } from '../toast/index.ts';
  import { getLink } from './linkPayload.ts';

  const shell = useProvidedShell();

  const COPIED_TOAST_MS = 4_000;

  const PROBLEM_TOAST_MS = 6_000;

  // awaited, because a clipboard the browser turns down rejects rather than throwing
  const copyLinkToClipboard = async () => {
    const result = getLink(shell);

    if (!result.ok) {
      toast.show({
        title: 'Could Not Make A Link',
        description: result.reason,
        severity: 'warn',
        duration: PROBLEM_TOAST_MS,
      });
      return;
    }

    try {
      await navigator.clipboard.writeText(result.link);
      toast.show({
        title: 'Link Copied',
        description: 'The link carries a copy of what is on screen.',
        severity: 'success',
        duration: COPIED_TOAST_MS,
      });
    } catch (err) {
      devWarning('link sharing: the clipboard turned down the link', err);
      toast.show({
        title: 'Could Not Copy The Link',
        description: 'Your browser turned down access to the clipboard.',
        severity: 'error',
        duration: PROBLEM_TOAST_MS,
      });
    }
  };
</script>

<template>
  <MenuItem
    @click="copyLinkToClipboard"
    :icon="mdiLink"
  >
    Copy Link
  </MenuItem>
</template>
