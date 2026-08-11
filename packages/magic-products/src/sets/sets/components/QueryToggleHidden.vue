<script setup lang="ts">
  import colors from '@core/utils/colors';
  import Button from '@magic/shared/Button';
  import Tooltip from '@magic/shared/Tooltip';

  import { computed } from 'vue';

  import { Query } from '../../highlightQueries.ts';
  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';

  const props = defineProps<{
    query: Query;
  }>();

  const { highlights } = useProvidedSetsProductState();

  const isHidden = computed(() => props.query.isHidden);
  const color = computed(() =>
    isHidden.value ? colors.GRAY_500 : props.query.color,
  );

  const toggleHidden = () =>
    highlights.setHidden(props.query.id, !isHidden.value);
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
