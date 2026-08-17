<script setup lang="ts">
  import { mdiCog } from '@mdi/js';

  import Dropdown from '../../components/dropdown/Dropdown.vue';
  import IconButton from '../../components/icon-button/IconButton.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedMagic } from '../../product/context.ts';
  import AnnotationToggle from '../annotations/AnnotationToggle.vue';
  import AppearanceToggle from '../appearance/AppearanceToggle.vue';
  import FullscreenButton from '../fullscreen/FullscreenButton.vue';
  import LinkSharingButton from '../link-sharing/LinkSharingButton.vue';
  import MultiplayerButton from '../multiplayer/MultiplayerButton.vue';
  import HistoryButtons from '../undo-redo/HistoryButtons.vue';

  const magic = useProvidedMagic();
</script>

<template>
  <HStack>
    <HistoryButtons />
    <AnnotationToggle v-if="magic.annotations" />

    <Well class="p-0 rounded-full overflow-hidden">
      <Dropdown
        side="top"
        align="end"
      >
        <template #trigger>
          <!-- opening a menu is not a toggle, so the lit state follows aria-expanded,
               which reka keeps honest, rather than a pressed state of its own -->
          <IconButton
            label="Settings"
            class="p-4 bg-transparent dark:bg-transparent aria-expanded:bg-gray-100 dark:aria-expanded:bg-gray-700"
            :size="20"
            :path="mdiCog"
          />
        </template>
        <VStack gap="0">
          <MultiplayerButton v-if="magic.multiplayer" />
          <LinkSharingButton v-if="magic.flags.linkSharing" />
          <FullscreenButton />
          <AppearanceToggle />
        </VStack>
      </Dropdown>
    </Well>
  </HStack>
</template>
