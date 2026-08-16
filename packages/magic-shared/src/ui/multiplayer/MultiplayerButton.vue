<script setup lang="ts">
  import { cn } from '@core/components/cn';
  import { nullThrows } from '@core/utils/assert';
  import {
    mdiAccountMultiplePlus,
    mdiCloseNetworkOutline,
    mdiExitRun,
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
  import { useProvidedMagic } from '../../product/context.ts';

  const magic = useProvidedMagic();

  const multiplayer = computed(() =>
    nullThrows(magic.multiplayer, 'multiplayer undefined'),
  );

  const roomCodeInput = ref('');

  const roomCodeValid = computed(() => roomCodeInput.value.length === 4);

  const joiningSession = ref(false);
  const startingSession = ref(false);

  const joinSession = async () => {
    if (!roomCodeValid.value) return;
    joiningSession.value = true;
    try {
      await multiplayer.value.room.join({ roomId: roomCodeInput.value });
    } catch (err) {
      // TODO surface the unreachable room in a toast
      // https://github.com/graph-kit/graph-kit/issues/783
      console.warn('multiplayer: could not reach the room to join it', err);
    } finally {
      joiningSession.value = false;
    }
  };

  const startSession = async () => {
    startingSession.value = true;
    try {
      await multiplayer.value.room.start();
    } catch (err) {
      // TODO surface the unreachable room in a toast
      // https://github.com/graph-kit/graph-kit/issues/783
      console.warn(
        'multiplayer: could not reach the server to start a room',
        err,
      );
    } finally {
      startingSession.value = false;
    }
  };

  // the button already reads "Joining…"/"Starting…", so only its counterpart explains itself
  const joinBlockedBy = computed(() => {
    if (joiningSession.value) return true;
    if (startingSession.value) return 'Starting a session';
    return roomCodeValid.value ? undefined : 'Enter a valid session code';
  });

  const startBlockedBy = computed(() => {
    if (startingSession.value) return true;
    return joiningSession.value ? 'Joining a session' : undefined;
  });

  const room = computed(() => multiplayer.value.room.state.value);

  const departure = computed(() => {
    if (!room.value.connected) return undefined;
    return room.value.me.isHost
      ? { text: 'Disband Session', icon: mdiCloseNetworkOutline }
      : { text: 'Leave Session', icon: mdiExitRun };
  });
</script>

<template>
  <Button
    v-if="departure"
    :class="
      cn(
        menuItemClasses,
        'dark:bg-red-500 bg-red-500 dark:hover:bg-red-600 text-white hover:bg-red-600',
      )
    "
    @click="multiplayer.room.leave"
  >
    <template #start>
      <Icon :path="departure.icon" />
    </template>
    {{ departure.text }}
  </Button>

  <DropdownSubmenu v-else>
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
            @keydown.enter="joinSession"
            placeholder="Session Code"
          />
          <Button
            :disabled="joinBlockedBy"
            @click="joinSession"
          >
            {{ joiningSession ? 'Joining…' : 'Join Session' }}
          </Button>
        </VStack>
      </DropdownSubmenu>
      <Button
        :class="menuItemClasses"
        :disabled="startBlockedBy"
        @click="startSession"
      >
        <template #start>
          <Icon :path="mdiAccountMultiplePlus" />
        </template>
        {{ startingSession ? 'Starting…' : 'Start A Session' }}
      </Button>
    </VStack>
  </DropdownSubmenu>
</template>
