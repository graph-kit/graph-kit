<script setup lang="ts">
  import { computed } from 'vue';

  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedMagic } from '../../product/context.ts';

  const { multiplayer } = useProvidedMagic();

  const roster = computed(() => {
    const room = multiplayer?.room.state.value;
    return room?.connected ? room.userIdToRosterEntry : undefined;
  });
</script>

<template>
  <Well v-if="roster">
    <VStack class="w-64">
      <span class="text-sm font-bold">In room</span>

      <VStack as="ul">
        <HStack
          v-for="(member, userId) in roster"
          :key="userId"
          as="li"
          :gap="2"
          class="items-center justify-between text-sm"
        >
          <span class="truncate">{{ member.displayName }}</span>
          <span class="text-xs opacity-70 shrink-0">{{ member.tier }}</span>
        </HStack>
      </VStack>
    </VStack>
  </Well>
</template>
