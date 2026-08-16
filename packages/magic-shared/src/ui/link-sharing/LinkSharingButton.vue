<script setup lang="ts">
  import { mdiCheck, mdiLink } from '@mdi/js';

  import { computed, ref } from 'vue';

  import Button from '../../components/button/Button.vue';
  import { menuItemClasses } from '../../components/dropdown/classes.ts';
  import Icon from '../../components/icon/Icon.vue';
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
          text: 'Copy Share Link',
          icon: mdiLink,
        };
  });
</script>

<template>
  <Button
    @click="copyLinkToClipboard"
    :class="menuItemClasses"
  >
    <template #start>
      <Icon :path="display.icon" />
    </template>
    {{ display.text }}
  </Button>
</template>
