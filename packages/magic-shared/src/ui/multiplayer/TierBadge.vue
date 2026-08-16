<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { Tier } from '@multiplayer/protocol/tiers';

  import { computed } from 'vue';

  import Tooltip from '../../components/tooltip/Tooltip.vue';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';

  const props = defineProps<{
    tier: Tier;
  }>();

  const { room } = useConnectedMultiplayer();

  const isHost = computed(() => room.value.me.isHost);

  const tierClasses: Record<Tier, string> = {
    host: 'bg-blue-500 hover:bg-blue-600',
    admin: 'bg-red-500 hover:bg-red-600',
    write: 'bg-green-500 hover:bg-green-600',
  };

  const tierTooltip: Record<Tier, string> = {
    host: 'Host Permission: The owner of this session',
    admin: 'Admin Permission: Has host privileges',
    write: 'Write Permission: Can edit content',
  };
</script>

<template>
  <Tooltip
    :label="tierTooltip[props.tier]"
    side="left"
  >
    <template #trigger>
      <div
        :class="cn('px-2 rounded-md cursor-pointer', tierClasses[props.tier])"
      >
        {{ props.tier }}
      </div>
    </template>
  </Tooltip>
</template>
