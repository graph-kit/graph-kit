<script setup lang="ts">
  import { computed, ref } from 'vue';

  import { useProvidedMagic } from '../../product/context.ts';
  import { serverStateFromTransit } from '../../product/server-state.ts';

  const magic = useProvidedMagic();
  const multiplayer = magic.multiplayer;

  const nameDraft = ref(multiplayer?.displayName.value ?? '');
  const starting = ref(false);
  const copied = ref(false);

  // the UI gate: a room cannot be created or joined without a name, so the
  // [Unknown] fallback is only ever reachable by pasting a raw room link
  const hasName = computed(() => nameDraft.value.trim().length > 0);

  const startRoom = async () => {
    if (!multiplayer || !hasName.value) return;
    multiplayer.displayName.value = nameDraft.value.trim();

    starting.value = true;
    try {
      // the host's current view becomes the seed, so the first frame after starting
      // matches the last frame before it
      await multiplayer.startRoom(
        magic.manifest.id as never,
        serverStateFromTransit(magic.transit.encode()),
      );
    } finally {
      starting.value = false;
    }
  };

  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    copied.value = true;
    setTimeout(() => (copied.value = false), 3000);
  };

  const tierLabel = (userId: string) =>
    multiplayer?.roster.value.find((entry) => entry.userId === userId)?.tier;
</script>

<template>
  <div
    v-if="multiplayer"
    class="rounded-lg bg-gray-200 dark:bg-gray-800 dark:text-white p-3 w-64 flex flex-col gap-2"
  >
    <template v-if="!multiplayer.inRoom.value">
      <label class="text-sm font-bold">Start a room</label>
      <input
        v-model="nameDraft"
        placeholder="Your display name"
        class="rounded-md px-2 py-1 bg-gray-100 dark:bg-gray-900 text-sm"
      />
      <button
        :disabled="!hasName || starting"
        class="rounded-md px-2 py-1 text-sm font-bold bg-gray-300 dark:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
        @click="startRoom"
      >
        {{ starting ? 'Starting…' : 'Start room' }}
      </button>
    </template>

    <template v-else>
      <div class="flex items-center justify-between">
        <span class="text-sm font-bold">Room</span>
        <button class="text-xs underline" @click="copyLink">
          {{ copied ? 'Link copied' : 'Copy link' }}
        </button>
      </div>

      <ul class="flex flex-col gap-1">
        <li
          v-for="member in multiplayer.roster.value"
          :key="member.userId"
          class="flex items-center justify-between text-sm"
        >
          <span class="truncate">{{ member.displayName }}</span>
          <span class="text-xs opacity-70 ml-2 shrink-0">
            {{ tierLabel(member.userId) }}
          </span>
        </li>
      </ul>
    </template>
  </div>
</template>
