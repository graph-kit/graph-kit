<script setup lang="ts">
  import colors from '@core/utils/colors';
  import Button from '@magic/shared/Button';
  import Tooltip from '@magic/shared/Tooltip';

  import { computed } from 'vue';

  import { Query } from '../../queries.ts';

  const props = defineProps<{
    query: Query;
  }>();

  const isHidden = computed(() => props.query.isHidden);
  const color = computed(() =>
    isHidden.value ? colors.GRAY_500 : props.query.color,
  );

  const toggleHidden = () => {
    props.query.isHidden = !isHidden.value;
  };
</script>

<template>
  <Tooltip
    :label="isHidden ? 'Show highlight' : 'Hide highlight'"
    side="left"
  >
    <template #trigger>
      <Button
        :style="{ backgroundColor: color }"
        class="h-full"
        @click="toggleHidden"
      />
    </template>
  </Tooltip>
</template>
