<script setup lang="ts">
  import { computed, ref } from 'vue';

  import Button from '../../components/button/Button.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import TextInput from '../../components/text-input/TextInput.vue';
  import { useProvidedMagic } from '../../product/context.ts';
  import { serverStateFromTransit } from '../../product/server-state.ts';

  const magic = useProvidedMagic();
  const { multiplayer } = magic;

  // 3 seconds of link copied confirmation state
  const LINK_COPIED_FEEDBACK_DURATION_MS = 3_000;

  const isStartingRoom = ref(false);
  const roomLinkCopiedToClipboard = ref(false);

  let linkCopiedResetTimer: NodeJS.Timeout;

  // committed on change rather than on input: pushing every keystroke to the room
  // would be a roster rebroadcast per character
  const displayName = computed({
    get: () => multiplayer?.displayName.value ?? '',
    set: (name) => multiplayer?.setDisplayName(name),
  });

  const startRoom = async () => {
    if (!multiplayer) return;

    isStartingRoom.value = true;
    try {
      // the host's current view becomes the seed, so the first frame after starting
      // matches the last frame before it
      await multiplayer.startRoom(
        magic.manifest.id as never,
        serverStateFromTransit(magic.transit.encode()),
      );
    } finally {
      isStartingRoom.value = false;
    }
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
  <Well v-if="multiplayer">
    <VStack
      :gap="2"
      class="w-64"
    >
      <!--
        always editable, in a room or out of one. renaming mid session is what makes an
        unnamed join recoverable, which is why nothing gates on having set a name first
      -->
      <TextInput
        v-model="displayName"
        update-on="change"
        placeholder="Your display name"
      />

      <Button
        v-if="!multiplayer.inRoom.value"
        :disabled="isStartingRoom"
        @click="startRoom"
      >
        {{ isStartingRoom ? 'Starting…' : 'Start room' }}
      </Button>

      <template v-else>
        <HStack
          :gap="2"
          class="items-center justify-between"
        >
          <span class="text-sm font-bold">In room</span>
          <Button @click="copyRoomLinkToClipboard">
            {{ roomLinkCopiedToClipboard ? 'Link copied' : 'Copy link' }}
          </Button>
        </HStack>

        <VStack
          :gap="1"
          as="ul"
        >
          <HStack
            v-for="member in multiplayer.roster.value"
            :key="member.userId"
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
