<script setup lang="ts">
  import { mdiTagEdit } from '@mdi/js';
  import { RosterEntry } from '@multiplayer/protocol/room';

  import Button from '../../components/button/Button.vue';
  import DropdownItem from '../../components/dropdown/DropdownItem.vue';
  import DropdownSubmenu from '../../components/dropdown/DropdownSubmenu.vue';
  import Icon from '../../components/icon/Icon.vue';
  import VStack from '../../components/layout/VStack.vue';
  import TextInput from '../../components/text-input/TextInput.vue';

  interface Props {
    member: RosterEntry;
  }

  defineProps<Props>();
</script>

<template>
  <DropdownSubmenu side="left">
    <template #trigger>
      <Icon :path="mdiTagEdit" />
      Edit Name
    </template>
    <VStack>
      <TextInput
        @vue:mounted="({ el }) => el?.focus()"
        :model-value="member.displayName"
        placeholder="Name"
      />
      <DropdownItem>
        <Button> Change </Button>
      </DropdownItem>
    </VStack>
  </DropdownSubmenu>
</template>
