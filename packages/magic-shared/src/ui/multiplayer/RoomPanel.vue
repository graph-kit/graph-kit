<script setup lang="ts">
  import { useLocalStorage, useMounted } from '@vueuse/core';

  import { computed, ref } from 'vue';

  import Button from '../../components/button/Button.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import TextInput from '../../components/text-input/TextInput.vue';
  import { DISPLAY_NAME_LOCAL_KEY } from '../../multiplayer/constants.ts';
  import { useProvidedMagic } from '../../product/context.ts';

  const magic = useProvidedMagic();
  const { multiplayer } = magic;

  // needed for ssr hydration
  const isMounted = useMounted();

  // 3 seconds of link copied confirmation state
  const LINK_COPIED_FEEDBACK_DURATION_MS = 3_000;

  const isStartingRoom = ref(false);
  const roomLinkCopiedToClipboard = ref(false);

  let linkCopiedResetTimer: NodeJS.Timeout;

  const room = computed(
    () => multiplayer?.room.state.value ?? { connected: false as const },
  );

  const userIdToRosterEntry = computed(() =>
    room.value.connected ? room.value.userIdToRosterEntry : {},
  );

  const displayName = useLocalStorage(DISPLAY_NAME_LOCAL_KEY, '');
  const hasDisplayName = computed(() => displayName.value.length > 0);

  const NEEDS_DISPLAY_NAME = 'Enter a display name first';

  const startRoomBlockedBy = computed(() => {
    if (isStartingRoom.value) return 'Already starting a room';
    return hasDisplayName.value ? undefined : NEEDS_DISPLAY_NAME;
  });

  const startRoom = async () => {
    if (!multiplayer) return;

    isStartingRoom.value = true;
    try {
      await multiplayer.room.start({ displayName: displayName.value });
    } finally {
      isStartingRoom.value = false;
    }
  };

  const changeDisplayName = () => {
    if (!room.value.connected) return;
    room.value.controls.setDisplayName(displayName.value);
  };

  const copyRoomLinkToClipboard = async () => {
    // without clearing, a second click resets the confirmation on the first one's timer
    clearTimeout(linkCopiedResetTimer);
    try {
      await navigator.clipboard.writeText(window.location.href);
      roomLinkCopiedToClipboard.value = true;
      linkCopiedResetTimer = setTimeout(
        () => (roomLinkCopiedToClipboard.value = false),
        LINK_COPIED_FEEDBACK_DURATION_MS,
      );
    } catch (err) {
      // TODO handle link copy failure with a toast
      // https://github.com/graph-kit/graph-kit/issues/783
      console.error('Failed to copy room link to clipboard!', err);
    }
  };
</script>

<template>
  <Well v-if="isMounted && multiplayer">
    <VStack class="w-64">
      <TextInput
        v-model.trim="displayName"
        placeholder="Your display name"
      />

      <Button
        v-if="!room.connected"
        :disabled="startRoomBlockedBy"
        @click="startRoom"
      >
        {{ isStartingRoom ? 'Starting…' : 'Start room' }}
      </Button>

      <template v-else>
        <Button
          :disabled="hasDisplayName ? undefined : NEEDS_DISPLAY_NAME"
          @click="changeDisplayName"
        >
          Change display name
        </Button>

        <HStack
          :gap="2"
          class="items-center justify-between"
        >
          <span class="text-sm font-bold">In room</span>
          <Button @click="copyRoomLinkToClipboard">
            {{ roomLinkCopiedToClipboard ? 'Link copied' : 'Copy link' }}
          </Button>
        </HStack>

        <VStack as="ul">
          <HStack
            v-for="(member, userId) in userIdToRosterEntry"
            :key="userId"
            as="li"
            :gap="2"
            class="items-center justify-between text-sm"
          >
            <span class="truncate">{{ member.displayName }}</span>
            <span class="text-xs opacity-70 shrink-0">{{ member.tier }}</span>
          </HStack>
        </VStack>
      </template>
    </VStack>
  </Well>
</template>
