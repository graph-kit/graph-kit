<script setup lang="ts">
  import { ref } from 'vue';

  import { useProvidedMagic } from '../../product/context.ts';
  import { serverStateFromTransit } from '../../product/server-state.ts';

  const magic = useProvidedMagic();
  const { multiplayer } = magic;

  // 3 seconds of link copied confirmation state
  const LINK_COPIED_FEEDBACK_DURATION_MS = 3_000;

  const isStartingRoom = ref(false);
  const roomLinkCopiedToClipboard = ref(false);

  let linkCopiedResetTimer: NodeJS.Timeout;

  // on change rather than on input: a name is committed when the user finishes
  // typing, and pushing every keystroke to the room would be a message per character
  const commitDisplayName = (event: Event) => {
    multiplayer?.setDisplayName((event.target as HTMLInputElement).value);
  };

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
  <div
    v-if="multiplayer"
    class="rounded-lg bg-gray-200 dark:bg-gray-800 dark:text-white p-3 w-64 flex flex-col gap-2"
  >
    <!--
      always editable, in a room or out of one. renaming mid session is what makes an
      unnamed join recoverable, which is why nothing gates on having set a name first
    -->
    <label class="text-xs font-bold opacity-70">Your name</label>
    <input
      :value="multiplayer.displayName.value"
      placeholder="Your display name"
      class="rounded-md px-2 py-1 bg-gray-100 dark:bg-gray-900 text-sm"
      @change="commitDisplayName"
    />

    <button
      v-if="!multiplayer.inRoom.value"
      :disabled="isStartingRoom"
      class="rounded-md px-2 py-1 text-sm font-bold bg-gray-300 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
      @click="startRoom"
    >
      {{ isStartingRoom ? 'Starting…' : 'Start room' }}
    </button>

    <template v-else>
      <div class="flex items-center justify-between">
        <span class="text-sm font-bold">In room</span>
        <button
          class="text-xs underline"
          @click="copyRoomLinkToClipboard"
        >
          {{ roomLinkCopiedToClipboard ? 'Link copied' : 'Copy link' }}
        </button>
      </div>

      <ul class="flex flex-col gap-1">
        <li
          v-for="member in multiplayer.roster.value"
          :key="member.userId"
          class="flex items-center justify-between text-sm"
        >
          <span class="truncate">{{ member.displayName }}</span>
          <span class="text-xs opacity-70 ml-2 shrink-0">{{
            member.tier
          }}</span>
        </li>
      </ul>
    </template>
  </div>
</template>
