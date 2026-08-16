<script setup lang="ts">
  import { mdiTagEdit } from '@mdi/js';
  import { RosterEntry } from '@multiplayer/protocol/room';

  import { ref } from 'vue';

  import Button from '../../components/button/Button.vue';
  import DropdownItem from '../../components/dropdown/DropdownItem.vue';
  import DropdownSubmenu from '../../components/dropdown/DropdownSubmenu.vue';
  import Icon from '../../components/icon/Icon.vue';
  import VStack from '../../components/layout/VStack.vue';
  import TextInput from '../../components/text-input/TextInput.vue';
  import { DISPLAY_NAME_LOCAL_KEY } from '../../multiplayer/constants.ts';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';

  interface Props {
    member: RosterEntry;
  }

  const props = defineProps<Props>();

  const { room } = useConnectedMultiplayer();

  const displayName = ref(props.member.displayName);

  const setDisplayName = () => {
    if (!displayName.value) return;
    localStorage.setItem(DISPLAY_NAME_LOCAL_KEY, displayName.value);
    room.value.controls.setDisplayName(displayName.value);
  };
</script>

<template>
  <DropdownSubmenu side="left">
    <template #trigger>
      <Icon :path="mdiTagEdit" />
      Edit Name
    </template>
    <VStack>
      <TextInput
        v-model.trim="displayName"
        @vue:mounted="({ el }) => el?.focus()"
        @keyup.enter="setDisplayName"
        placeholder="Name"
      />
      <DropdownItem>
        <Button
          @click="setDisplayName"
          :disabled="displayName.length === 0 ? 'Enter a name' : false"
        >
          Change
        </Button>
      </DropdownItem>
    </VStack>
  </DropdownSubmenu>
</template>
