<script setup lang="ts">
  import { nullThrows } from '@core/utils/assert';
  import { devWarning } from '@core/utils/debugging';
  import {
    mdiAccountMultiple,
    mdiAccountMultiplePlus,
    mdiBillboard,
    mdiBroadcast,
    mdiClose,
    mdiCloseNetworkOutline,
    mdiExitRun,
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
  import { useProvidedShell } from '../../product/context.ts';
  import { toast } from '../toast/index.ts';

  const shell = useProvidedShell();

  const multiplayer = computed(() =>
    nullThrows(shell.multiplayer, 'multiplayer undefined'),
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

  const SESSION_FAILED_TOAST_MS = 8_000;

  /** long enough to read a code off and pass it on */
  const SESSION_STARTED_TOAST_MS = 10_000;

  const joinSession = async () => {
    if (!roomCodeValid.value) return;
    joiningSession.value = true;
    try {
      const result = await multiplayer.value.room.join({
        roomId: roomCodeInput.value,
      });

      // the server's one refusal, which makes the code wrong rather than the trip
      if (!result.joined) {
        toast.show({
          title: 'No Session Under That Code',
          description: `${roomCodeInput.value} does not belong to a session that is still running.`,
          severity: 'warn',
          duration: SESSION_FAILED_TOAST_MS,
        });
      }
    } catch (err) {
      devWarning('multiplayer: could not reach the room to join it', err);
      toast.show({
        title: 'Could Not Reach The Session',
        description:
          'The server did not answer. Check your connection and try again.',
        severity: 'error',
        duration: SESSION_FAILED_TOAST_MS,
      });
    } finally {
      joiningSession.value = false;
    }
  };

  const startSession = async () => {
    startingSession.value = true;
    try {
      const roomId = await multiplayer.value.room.start();
      toast.show({
        title: 'Session Started',
        description: `Session live with code ${roomId.toUpperCase()}.`,
        severity: 'success',
        duration: SESSION_STARTED_TOAST_MS,
      });
    } catch (err) {
      devWarning(
        'multiplayer: could not reach the server to start a room',
        err,
      );
      toast.show({
        title: 'Could Not Start A Session',
        description:
          'The server did not answer. Check your connection and try again.',
        severity: 'error',
        duration: SESSION_FAILED_TOAST_MS,
      });
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

  const ui = computed(() => multiplayer.value.ui);

  const rosterToggle = computed(() =>
    ui.value.rosterPanel.isShown.value
      ? { text: 'Hide Collaborators', icon: mdiClose }
      : { text: 'Show Collaborators', icon: mdiAccountMultiple },
  );

  const joinBannerToggle = computed(() =>
    ui.value.joinBanner.isShown.value
      ? { text: 'Hide Join Banner', icon: mdiClose }
      : { text: 'Show Join Banner', icon: mdiBillboard },
  );

  const toggleRoster = () => {
    const panel = ui.value.rosterPanel;
    panel.setHighlight(false);
    if (panel.isShown.value) return panel.hide();
    panel.show();
  };

  const toggleJoinBanner = () => {
    const panel = ui.value.joinBanner;
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
        @mouseenter="ui.rosterPanel.setHighlight(true)"
        @mouseleave="ui.rosterPanel.setHighlight(false)"
        :icon="rosterToggle.icon"
      >
        {{ rosterToggle.text }}
      </MenuItem>
      <MenuItem
        @click="toggleJoinBanner"
        @mouseenter="ui.joinBanner.setHighlight(true)"
        @mouseleave="ui.joinBanner.setHighlight(false)"
        :icon="joinBannerToggle.icon"
      >
        {{ joinBannerToggle.text }}
      </MenuItem>
      <MenuItem
        @click="multiplayer.room.leave"
        :icon="departure.icon"
        class="hover:bg-red-500 dark:hover:bg-red-500 active:bg-red-600 hover:text-white"
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
