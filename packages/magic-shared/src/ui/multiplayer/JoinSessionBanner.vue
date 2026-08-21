<script setup lang="ts">
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';
  import CloseButton from './CloseButton.vue';

  const { room, multiplayer } = useConnectedMultiplayer();
</script>

<template>
  <Well class="py-4 px-24 text-center">
    <CloseButton @closed="multiplayer.ui.joinBanner.hide" />
    <VStack class="font-bold">
      <h2 class="text-2xl">Join Session With Code</h2>
      <h1 class="text-7xl uppercase">{{ room.id }}</h1>
    </VStack>
  </Well>
</template>
