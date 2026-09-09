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
  import { StartRefusal } from '@multiplayer/protocol/events';
  import { RoomId } from '@multiplayer/protocol/room';

  import { computed, ref } from 'vue';

  import Button from '../../components/button/Button.vue';
  import DropdownItem from '../../components/dropdown/DropdownItem.vue';
  import DropdownSubmenu from '../../components/dropdown/DropdownSubmenu.vue';
  import MenuItem from '../../components/dropdown/MenuItem.vue';
  import Icon from '../../components/icon/Icon.vue';
  import VStack from '../../components/layout/VStack.vue';
  import TextInput from '../../components/text-input/TextInput.vue';
  import { useProvidedMultiplayer } from '../../multiplayer/context.ts';
  import { joinAndFollowHost } from '../../multiplayer/joinAndFollowHost.ts';
  import { useProvidedShell } from '../../product/context.ts';
  import { toast } from '../toast/index.ts';

  const shell = useProvidedShell();

  /** the room itself, which a product that cannot host still gets to join and leave */
  const connection = nullThrows(
    useProvidedMultiplayer(),
    'multiplayer connection not provided',
  );

  /** absent on a product that opted out of multiplayer, which is what rules out hosting */
  const product = computed(() => shell.multiplayer);

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

  /** exhaustive, so a refusal added to the union is a compile error rather than silence */
  const START_REFUSAL_DESCRIPTION: Record<StartRefusal, string> = {
    atCapacity:
      'The server is holding as many sessions as it can right now. Try again in a few minutes.',
    tooManyAttempts:
      'Too many sessions started from here just now. Wait a minute and try again.',
  };

  const joiningSession = ref(false);
  const startingSession = ref(false);

  const SESSION_FAILED_TOAST_MS = 8_000;

  /** long enough to read a code off and pass it on */
  const SESSION_STARTED_TOAST_MS = 10_000;

  const joinRoom = (roomId: RoomId) => {
    const productRoom = product.value?.room;
    if (productRoom) return productRoom.join({ roomId });
    // nothing here for the room to open on, so the host's product is the destination
    return joinAndFollowHost({ actions: connection.actions, roomId });
  };

  const joinSession = async () => {
    if (!roomCodeValid.value) return;
    joiningSession.value = true;
    try {
      const result = await joinRoom(roomCodeInput.value);

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
    const productRoom = product.value?.room;
    if (!productRoom) return;
    startingSession.value = true;
    try {
      const result = await productRoom.start();

      if (!result.started) {
        toast.show({
          title: 'Could Not Start A Session',
          description: START_REFUSAL_DESCRIPTION[result.reason],
          severity: 'warn',
          duration: SESSION_FAILED_TOAST_MS,
        });
        return;
      }

      toast.show({
        title: 'Session Started',
        description: `Session live with code ${result.roomId.toUpperCase()}.`,
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

  const room = computed(() => connection.room.value);

  /** the room's own chrome, which only a product the room can open on carries */
  const ui = computed(() => product.value?.ui);

  const rosterToggle = computed(() =>
    ui.value?.rosterPanel.isShown.value
      ? { text: 'Hide Collaborators', icon: mdiClose }
      : { text: 'Show Collaborators', icon: mdiAccountMultiple },
  );

  const joinBannerToggle = computed(() =>
    ui.value?.joinBanner.isShown.value
      ? { text: 'Hide Join Banner', icon: mdiClose }
      : { text: 'Show Join Banner', icon: mdiBillboard },
  );

  const toggleRoster = () => {
    const panel = ui.value?.rosterPanel;
    if (!panel) return;
    panel.setHighlight(false);
    if (panel.isShown.value) return panel.hide();
    panel.show();
  };

  const toggleJoinBanner = () => {
    const panel = ui.value?.joinBanner;
    if (!panel) return;
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
        v-if="ui"
        @click="toggleRoster"
        @mouseenter="ui.rosterPanel.setHighlight(true)"
        @mouseleave="ui.rosterPanel.setHighlight(false)"
        :icon="rosterToggle.icon"
      >
        {{ rosterToggle.text }}
      </MenuItem>
      <MenuItem
        v-if="ui"
        @click="toggleJoinBanner"
        @mouseenter="ui.joinBanner.setHighlight(true)"
        @mouseleave="ui.joinBanner.setHighlight(false)"
        :icon="joinBannerToggle.icon"
      >
        {{ joinBannerToggle.text }}
      </MenuItem>
      <MenuItem
        @click="connection.actions.room.leave"
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
        v-if="product"
        @click="startSession"
        :icon="mdiAccountMultiplePlus"
        :disabled="startBlockedBy"
      >
        {{ startingSession ? 'Starting…' : 'Start A Session' }}
      </MenuItem>
    </VStack>
  </DropdownSubmenu>
</template>
