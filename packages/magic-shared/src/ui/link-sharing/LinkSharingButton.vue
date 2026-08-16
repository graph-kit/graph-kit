<script setup lang="ts">
  import { mdiCheck, mdiLink } from '@mdi/js';

  import { computed, ref } from 'vue';

  import MenuItem from '../../components/dropdown/MenuItem.vue';
  import { useProvidedMagic } from '../../product/context.ts';
  import { getLink } from './linkPayload.ts';

  const magic = useProvidedMagic();

  let linkCopiedResetTimer: NodeJS.Timeout;

  // 3 seconds of link copied confirmation state
  const LINK_COPIED_FEEDBACK_DURATION_MS = 3_000;

  const copyLinkToClipboard = () => {
    clearTimeout(linkCopiedResetTimer);
    try {
      navigator.clipboard.writeText(getLink(magic));
      linkCopiedToClipboard.value = true;
      linkCopiedResetTimer = setTimeout(
        () => (linkCopiedToClipboard.value = false),
        LINK_COPIED_FEEDBACK_DURATION_MS,
      );
    } catch (err) {
      // TODO handle link copy failure with a toast
      // https://github.com/graph-kit/graph-kit/issues/783
      console.error('Failed to copy to clipboard!', err);
    }
  };

  const linkCopiedToClipboard = ref(false);

  const display = computed(() => {
    return linkCopiedToClipboard.value
      ? {
          text: 'Link Copied',
          icon: mdiCheck,
        }
      : {
          text: 'Copy Link',
          icon: mdiLink,
        };
  });
</script>

<template>
  <MenuItem
    @click="copyLinkToClipboard"
    :icon="display.icon"
  >
    {{ display.text }}
  </MenuItem>
</template>
