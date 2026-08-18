<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import {
    mdiAccountMultiplePlus,
    mdiBroadcast,
    mdiCloseNetworkOutline,
    mdiExitRun,
    mdiEyeOffOutline,
    mdiEyeOutline,
    mdiHumanGreetingProximity,
    mdiKeyboardOutline,
  } from '@mdi/js';

  import { computed, ref } from 'vue';

  import Button from '../../components/button/Button.vue';
  import DropdownItem from '../../components/dropdown/DropdownItem.vue';
  import DropdownSubmenu from '../../components/dropdown/DropdownSubmenu.vue';
  import MenuItem from '../../components/dropdown/MenuItem.vue';
  import Icon from '../../components/icon/Icon.vue';
  import VStack from '../../components/layout/VStack.vue';
  import TextInput from '../../components/text-input/TextInput.vue';
  import { useProvidedMagic } from '../../product/context.ts';

  const magic = useProvidedMagic();

  const multiplayer = computed(() =>
    nullThrows(magic.multiplayer, 'multiplayer undefined'),
  );

  const enteredRoomCode = ref('');

  const ROOM_ID_LENGTH = 4;

  const roomCodeInput = computed<string>({
    get: () => enteredRoomCode.value,
    set: (next) => {
      enteredRoomCode.value = next
        .replace(/[^a-z]/gi, '')
        .toUpperCase()
        .slice(0, ROOM_ID_LENGTH);
    },
  });

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

  const rosterPanel = computed(() => multiplayer.value.ui.rosterPanel);

  const rosterToggle = computed(() =>
    rosterPanel.value.isShown.value
      ? { text: 'Hide Collaborators', icon: mdiEyeOffOutline }
      : { text: 'Show Collaborators', icon: mdiEyeOutline },
  );

  const toggleRoster = () => {
    const panel = rosterPanel.value;
    panel.setHighlight(false);
    if (panel.isShown.value) return panel.hide();
    panel.show();
  };

  const departure = computed(() => {
    if (!room.value.connected) return undefined;
    return room.value.me.isHost
      ? { text: 'Disband Session', icon: mdiCloseNetworkOutline }
      : { text: 'Leave Session', icon: mdiExitRun };
  });

  const display = computed(() => {
    if (!room.value.connected)
      return { text: 'Collaborate Live', icon: mdiHumanGreetingProximity };
    return {
      text: `Session ${room.value.id.toUpperCase()}`,
      icon: mdiBroadcast,
    };
  });
</script>

<template>
  <DropdownSubmenu>
    <template #trigger>
      <Icon :path="display.icon" />
      {{ display.text }}
    </template>

    <VStack
      v-if="departure"
      gap="0"
    >
      <MenuItem
        @click="toggleRoster"
        @mouseenter="rosterPanel.setHighlight(true)"
        @mouseleave="rosterPanel.setHighlight(false)"
        :icon="rosterToggle.icon"
      >
        {{ rosterToggle.text }}
      </MenuItem>
      <MenuItem
        @click="multiplayer.room.leave"
        :icon="departure.icon"
        class="hover:bg-red-500 dark:hover:bg-red-500 hover:text-white"
      >
        {{ departure.text }}
      </MenuItem>
    </VStack>

    <VStack
      v-else
      gap="0"
    >
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
          <DropdownItem>
            <Button
              @click="joinSession"
              :disabled="joinBlockedBy"
            >
              {{ joiningSession ? 'Joining…' : 'Join Session' }}
            </Button>
          </DropdownItem>
        </VStack>
      </DropdownSubmenu>
      <MenuItem
        @click="startSession"
        :icon="mdiAccountMultiplePlus"
        :disabled="startBlockedBy"
      >
        {{ startingSession ? 'Starting…' : 'Start A Session' }}
      </MenuItem>
    </VStack>
  </DropdownSubmenu>
</template>
