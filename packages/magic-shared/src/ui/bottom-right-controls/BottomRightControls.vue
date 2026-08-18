<script setup lang="ts">
  import { mdiDotsVertical } from '@mdi/js';

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

  const magic = useProvidedMagic();
</script>

<template>
  <HStack>
    <AnnotationToggle v-if="magic.annotations" />

    <Well class="p-0 rounded-full overflow-hidden">
      <Dropdown
        side="top"
        align="end"
      >
        <template #trigger>
          <IconButton
            :size="20"
            :path="mdiDotsVertical"
            label="More Options"
            class="p-4 bg-transparent dark:bg-transparent aria-expanded:bg-gray-100 dark:aria-expanded:bg-gray-700"
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
