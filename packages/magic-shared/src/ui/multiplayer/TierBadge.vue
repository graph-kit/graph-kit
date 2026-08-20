<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { mdiCrown, mdiPencil, mdiShieldAccount } from '@mdi/js';
  import { Tier } from '@multiplayer/protocol/tiers';

  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import Tooltip from '../../components/tooltip/Tooltip.vue';

  const props = defineProps<{
    tier: Tier;
  }>();

  const tierClasses: Record<Tier, string> = {
    host: 'bg-blue-500 hover:bg-blue-600',
    admin: 'bg-red-500 hover:bg-red-600',
    write: 'bg-green-500 hover:bg-green-600',
  };

  const tierTooltip: Record<Tier, string> = {
    host: 'Role: Host',
    admin: 'Role: Admin',
    write: 'Role: Write',
  };

  const tierIcon: Record<Tier, string> = {
    host: mdiCrown,
    admin: mdiShieldAccount,
    write: mdiPencil,
  };
</script>

<template>
  <Tooltip
    :label="tierTooltip[props.tier]"
    side="left"
  >
    <template #trigger>
      <HStack
        gap="1"
        :class="
          cn(
            'px-2 text-sm capitalize rounded-sm text-white',
            tierClasses[props.tier],
          )
        "
      >
        <Icon
          :path="tierIcon[props.tier]"
          :size="16"
        />
        {{ props.tier }}
      </HStack>
    </template>
  </Tooltip>
</template>
