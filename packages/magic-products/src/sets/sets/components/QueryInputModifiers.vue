<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { nullThrows } from '@core/utils/assert';
  import Button from '@magic/shared/Button';
  import Dropdown from '@magic/shared/Dropdown';
  import Icon from '@magic/shared/Icon';
  import IconButton from '@magic/shared/IconButton';
  import Tooltip from '@magic/shared/Tooltip';
  import { mdiInformationOutline } from '@mdi/js';

  import { computed } from 'vue';

  import { Query } from '../../queries.ts';
  import { useProvidedSetsProductState } from '../../useSetsProduct.ts';

  const props = defineProps<{
    query: Query;
  }>();

  const previewValue = defineModel<string>();

  const { queryAnalysis } = useProvidedSetsProductState();

  const simplified = computed(
    () => queryAnalysis.simplifiedQueries.value[props.query.id],
  );

  const disambiguated = computed(
    () => queryAnalysis.disambiguatedQueries.value[props.query.id],
  );

  // trigger example: $$ A\cup A $$
  const applySimplification = () => {
    props.query.editor.replace(
      nullThrows(simplified.value, 'simplified query is null'),
    );
    props.query.editor.element?.focus();
  };

  // trigger example: $$ A\cap B\cup C $$
  const applyDisambiguation = () => {
    props.query.editor.replace(
      nullThrows(disambiguated.value, 'disambiguated query is null'),
    );
    props.query.editor.element?.focus();
  };
</script>

<template>
  <!-- checked against null rather than falsy, since a query selecting nothing simplifies to '' -->
  <div
    v-if="disambiguated !== null || simplified !== null"
    class="absolute right-0"
  >
    <Dropdown
      align="center"
      open-on="hover"
      class="flex min-w-0 gap-2 p-2"
    >
      <template #trigger>
        <IconButton
          label=""
          :path="mdiInformationOutline"
          class="rounded-none rounded-r-md h-10"
        />
      </template>
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
          >
            Disambiguate
            <Icon :path="mdiInformationOutline" />
          </Button>
        </template>
      </Tooltip>

      <Tooltip
        v-if="simplified !== null"
        label="This expression can be simplified."
      >
        <template #trigger>
          <Button
            @mouseenter="previewValue = simplified"
            @mouseleave="previewValue = undefined"
            @vue:unmounted="previewValue = undefined"
            @click="applySimplification"
          >
            Simplify
            <Icon :path="mdiInformationOutline" />
          </Button>
        </template>
      </Tooltip>
    </Dropdown>
  </div>
</template>
