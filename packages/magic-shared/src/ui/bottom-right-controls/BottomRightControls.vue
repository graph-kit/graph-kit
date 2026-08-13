<script setup lang="ts">
  import { mdiCog } from '@mdi/js';

  import Dropdown from '../../components/dropdown/Dropdown.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import ToggleIconButton from '../../components/toggle-icon-button/ToggleIconButton.vue';
  import { useProvidedMagic } from '../../product/context.ts';
  import AnnotationToggle from '../annotations/AnnotationToggle.vue';
  import AppearanceToggle from '../appearance/AppearanceToggle.vue';
  import FullscreenButton from '../fullscreen/FullscreenButton.vue';
  import LinkSharingButton from '../link-sharing/LinkSharingButton.vue';
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
          <ToggleIconButton
            label="Settings"
            class="p-4 bg-transparent dark:bg-transparent"
            :size="20"
            :path="mdiCog"
          />
        </template>
        <VStack class="gap-1 px-1">
          <LinkSharingButton v-if="magic.ui.linkSharing" />
          <FullscreenButton />
          <div
            class="w-full bg-white opacity-10"
            :style="{ height: '1px' }"
          ></div>
          <AppearanceToggle />
        </VStack>
      </Dropdown>
    </Well>
  </HStack>
</template>
