<script setup lang="ts">
  import {
    mdiAccountMultiplePlus,
    mdiHumanGreetingProximity,
    mdiKeyboardOutline,
  } from '@mdi/js';

  import { computed, ref } from 'vue';

  import Button from '../../components/button/Button.vue';
  import DropdownSubmenu from '../../components/dropdown/DropdownSubmenu.vue';
  import { menuItemClasses } from '../../components/dropdown/classes.ts';
  import Icon from '../../components/icon/Icon.vue';
  import VStack from '../../components/layout/VStack.vue';
  import TextInput from '../../components/text-input/TextInput.vue';

  const roomCodeInput = ref('');

  const roomCodeValid = computed(() => roomCodeInput.value.length === 4);
</script>

<template>
  <DropdownSubmenu>
    <template #trigger>
      <Icon :path="mdiHumanGreetingProximity" />
      Collaborate Live
    </template>
    <VStack gap="0">
      <DropdownSubmenu side="left">
        <template #trigger>
          <Icon :path="mdiKeyboardOutline" />
          Join With Code
        </template>
        <VStack>
          <TextInput
            v-model="roomCodeInput"
            @vue:mounted="({ el }) => el?.focus()"
            @keydown.enter=""
            placeholder="Session Code"
          />
          <Button
            :disabled="roomCodeValid ? undefined : 'Enter a valid session code'"
          >
            Join Session
          </Button>
        </VStack>
      </DropdownSubmenu>
      <Button :class="menuItemClasses">
        <template #start>
          <Icon :path="mdiAccountMultiplePlus" />
        </template>
        Start A Session
      </Button>
    </VStack>
  </DropdownSubmenu>
</template>
