<script setup lang="ts">
  import colors from '@core/utils/colors';
  import Button from '@magic/shared/Button';
  import Tooltip from '@magic/shared/Tooltip';

  import { computed } from 'vue';

  import { Query } from '../queries.ts';

  const props = defineProps<{
    query: Query;
  }>();

  const hidden = computed(() => props.query.hidden);
  const color = computed(() =>
    hidden.value ? colors.GRAY_500 : props.query.color,
  );

  const toggleHidden = () => {
    // query is a handle into the query store rather than component state, and
    // the parent reads the flag back off it
    // eslint-disable-next-line vue/no-mutating-props
    props.query.hidden = !hidden.value;
  };
</script>

<template>
  <Tooltip
    :label="hidden ? 'Show region' : 'Hide region'"
    side="left"
  >
    <template #trigger>
      <Button
        @click="toggleHidden"
        :style="{ backgroundColor: color }"
        class="h-full"
      />
    </template>
  </Tooltip>
</template>
