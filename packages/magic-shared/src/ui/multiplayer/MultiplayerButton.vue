<script setup lang="ts">
  import {
    mdiAccountMultiplePlus,
    mdiChevronRight,
    mdiHumanGreetingProximity,
    mdiKeyboardOutline,
  } from '@mdi/js';

  import { computed, ref } from 'vue';

  import Button from '../../components/button/Button.vue';
  import DropdownSubmenu from '../../components/dropdown/DropdownSubmenu.vue';
  import Icon from '../../components/icon/Icon.vue';
  import VStack from '../../components/layout/VStack.vue';
  import TextInput from '../../components/text-input/TextInput.vue';

  // the highlight background marks menu position, so a focus ring on top of it is redundant
  const itemClasses =
    'px-2 bg-transparent dark:bg-transparent w-full justify-start focus-visible:ring-0 focus-visible:ring-offset-0';

  // the trigger loses hover once the pointer crosses into the submenu, so the open state carries the highlight
  const triggerClasses = `${itemClasses} data-[state=open]:bg-gray-100 dark:data-[state=open]:bg-gray-900`;

  const roomCodeInput = ref('');

  const roomCodeValid = computed(() => roomCodeInput.value.length === 4);
</script>

<template>
  <DropdownSubmenu>
    <template #trigger>
      <Button :class="triggerClasses">
        <template #start>
          <Icon :path="mdiHumanGreetingProximity" />
        </template>
        Collaborate Live
        <template #end>
          <Icon
            class="ml-auto"
            :size="20"
            :path="mdiChevronRight"
          />
        </template>
      </Button>
    </template>
    <VStack gap="0">
      <DropdownSubmenu side="left">
        <template #trigger>
          <Button :class="itemClasses">
            <template #start>
              <Icon :path="mdiKeyboardOutline" />
            </template>
            Join With Code
          </Button>
        </template>
        <VStack>
          <TextInput
            v-model="roomCodeInput"
            placeholder="Room Code"
            @vue:mounted="({ el }) => el?.focus()"
          />
          <Button :disabled="!roomCodeValid">Join Session</Button>
        </VStack>
      </DropdownSubmenu>
      <Button :class="itemClasses">
        <template #start>
          <Icon :path="mdiAccountMultiplePlus" />
        </template>
        Start A Session
      </Button>
    </VStack>
  </DropdownSubmenu>
</template>
