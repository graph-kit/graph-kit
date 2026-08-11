<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import Button from '@magic/shared/Button';
  import Dropdown from '@magic/shared/Dropdown';
  import IconButton from '@magic/shared/IconButton';
  import Tooltip from '@magic/shared/Tooltip';
  import Well from '@magic/shared/Well';
  import { mdiInformationOutline } from '@mdi/js';

  import { computed } from 'vue';

  import { Query } from '../../highlightQueries.ts';
  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';

  const props = defineProps<{
    query: Query;
  }>();

  const { highlights, queryAnalysis } = useProvidedSetsProductState();

  const simplified = computed(
    () => queryAnalysis.simplifiedQueries.value[props.query.id],
  );

  const disambiguated = computed(
    () => queryAnalysis.disambiguatedQueries.value[props.query.id],
  );

  // trigger example: $$ A\cup A $$
  const applySimplification = () =>
    highlights.replaceQuery(
      props.query.id,
      nullThrows(simplified.value, 'simplified query is null'),
    );

  // trigger example: $$ A\cap B\cup C $$
  const applyDisambiguation = () =>
    highlights.replaceQuery(
      props.query.id,
      nullThrows(disambiguated.value, 'disambiguated query is null'),
    );
</script>

<template>
  <div
    v-if="disambiguated || simplified"
    class="absolute right-0"
  >
    <Dropdown align="center">
      <template #trigger>
        <IconButton
          label=""
          :path="mdiInformationOutline"
          class="text-black bg-gray-300 hover:bg-gray-400 rounded-none rounded-r-md h-10"
        />
      </template>
      <Well class="p-1">
        <Tooltip
          v-if="disambiguated"
          :label="`Ambiguous order of operations. Click to write it as: ${disambiguated}`"
        >
          <template #trigger>
            <!-- TODO replace with a proper icon button -->
            <Button @click="applyDisambiguation">&#9432;</Button>
          </template>
        </Tooltip>

        <Tooltip
          v-if="simplified"
          :label="`Simplify expression to: ${simplified}`"
        >
          <template #trigger>
            <Button @click="applySimplification">Simplify</Button>
          </template>
        </Tooltip>
      </Well>
    </Dropdown>
  </div>
</template>
