<script setup lang="ts">
  import { cn } from '@core/components/cn';
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

  const previewValue = defineModel<string>();

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
    <Dropdown
      align="center"
      open-on="hover"
    >
      <template #trigger>
        <IconButton
          label=""
          :path="mdiInformationOutline"
          :class="
            cn(
              'text-black bg-gray-300 hover:bg-gray-400 rounded-none rounded-r-md h-10',
              previewValue && 'invisible',
            )
          "
        />
      </template>
      <Well class="p-1">
        <Tooltip
          v-if="disambiguated"
          label="Operator precedence isn't standardized in set theory. Using parentheses makes evaluation order explicit."
        >
          <template #trigger>
            <Button
              @mouseenter="previewValue = disambiguated"
              @mouseleave="previewValue = undefined"
              @vue:unmounted="previewValue = undefined"
              @click="applyDisambiguation"
              >Disambiguate</Button
            >
          </template>
        </Tooltip>

        <Tooltip
          v-if="simplified"
          label="This expression can be simplified."
        >
          <template #trigger>
            <Button
              @mouseenter="previewValue = simplified"
              @mouseleave="previewValue = undefined"
              @vue:unmounted="previewValue = undefined"
              @click="applySimplification"
              >Simplify</Button
            >
          </template>
        </Tooltip>
      </Well>
    </Dropdown>
  </div>
</template>
