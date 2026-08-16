<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import colors, { Color } from '@core/utils/colors';
  import { mdiClose } from '@mdi/js';
  import { Tier } from '@multiplayer/protocol/tiers';

  import { computed } from 'vue';

  import Button from '../../components/button/Button.vue';
  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import { useProvidedMagic } from '../../product/context.ts';

  const magic = useProvidedMagic();
  const multiplayer = computed(() =>
    nullThrows(magic.multiplayer, 'multiplayer undefined'),
  );

  const roster = computed(() => {
    const room = multiplayer.value.room.state.value;
    return room?.connected
      ? Object.values(room.userIdToRosterEntry)
      : undefined;
  });

  const closeRoster = () => {
    multiplayer.value.ui.rosterPanel.hide();
  };

  const tierToColor: Record<Tier, Color> = {
    host: colors.AMBER_500,
    admin: colors.RED_500,
    write: colors.GREEN_500,
  };
</script>

<template>
  <Well v-if="roster">
    <VStack class="font-bold">
      <HStack gap="6">
        <span class="text-2xl">Collaborators ({{ roster.length }})</span>

        <Button
          @click="closeRoster"
          class="hover:text-red-500 bg-transparent dark:bg-transparent dark:hover:bg-transparent p-0"
        >
          <Icon
            :path="mdiClose"
            :size="26"
          />
        </Button>
      </HStack>

      <VStack class="text-lg">
        <HStack
          v-for="(member, userId) in roster"
          :key="userId"
          :gap="2"
        >
          <div
            class="px-2 rounded-md"
            :style="{ background: tierToColor[member.tier] }"
          >
            {{ member.tier }}
          </div>
          <span>{{ member.displayName }}</span>
        </HStack>
      </VStack>
    </VStack>
  </Well>
</template>
