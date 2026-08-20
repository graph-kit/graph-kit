<script setup lang="ts">
  import { Tier } from '@multiplayer/protocol/tiers';

  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import Tooltip from '../../components/tooltip/Tooltip.vue';
  import { tierColor, tierIcon, tierTooltip } from './tier.ts';

  const props = defineProps<{
    tier: Tier;
  }>();
</script>

<template>
  <Tooltip
    :label="tierTooltip[props.tier]"
    side="left"
  >
    <template #trigger>
      <HStack
        gap="1"
        class="px-2 text-sm capitalize rounded-sm text-white"
        :style="{ backgroundColor: tierColor[props.tier] }"
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
