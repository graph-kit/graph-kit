<script setup lang="ts">
  import {
    mdiAccountCog,
    mdiCloseNetworkOutline,
    mdiDotsVertical,
    mdiExitRun,
    mdiTagEdit,
  } from '@mdi/js';
  import { Tier } from '@multiplayer/protocol/tiers';

  import { computed } from 'vue';

  import Button from '../../components/button/Button.vue';
  import Dropdown from '../../components/dropdown/Dropdown.vue';
  import DropdownItem from '../../components/dropdown/DropdownItem.vue';
  import DropdownSubmenu from '../../components/dropdown/DropdownSubmenu.vue';
  import MenuItem from '../../components/dropdown/MenuItem.vue';
  import Icon from '../../components/icon/Icon.vue';
  import HStack from '../../components/layout/HStack.vue';
  import VStack from '../../components/layout/VStack.vue';
  import Well from '../../components/layout/Well.vue';
  import TextInput from '../../components/text-input/TextInput.vue';
  import { useConnectedMultiplayer } from '../../multiplayer/useConnectedMultiplayer.ts';
  import RosterCloseButton from './RosterCloseButton.vue';
  import TierBadge from './TierBadge.vue';

  const { room, multiplayer } = useConnectedMultiplayer();

  const roster = computed(() => Object.values(room.value.userIdToRosterEntry));

  const departure = computed(() => {
    return room.value.me.isHost
      ? { text: 'Disband Session', icon: mdiCloseNetworkOutline }
      : { text: 'Leave Session', icon: mdiExitRun };
  });

  const tiers: Tier[] = ['admin', 'write'];
</script>

<template>
  <Well class="p-3">
    <VStack class="font-bold">
      <div class="text-2xl pr-12">Collaborators ({{ roster.length }})</div>

      <RosterCloseButton />

      <VStack class="text-lg">
        <HStack
          v-for="(member, userId) in roster"
          :key="userId"
          :gap="2"
        >
          <Dropdown side="left">
            <template #trigger>
              <HStack
                class="w-full hover:bg-gray-900 py-1 px-2 cursor-pointer justify-between rounded-md"
              >
                <span>{{ member.displayName }}</span>
                <HStack>
                  <TierBadge :tier="member.tier" />
                  <Icon
                    :path="mdiDotsVertical"
                    :size="22"
                  />
                </HStack>
              </HStack>
            </template>
            <VStack gap="0">
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
              <DropdownSubmenu side="left">
                <template #trigger>
                  <Icon :path="mdiAccountCog" />
                  Change Role
                </template>
                <VStack gap="0">
                  <MenuItem v-for="tier in tiers">
                    {{ tier }}
                  </MenuItem>
                </VStack>
              </DropdownSubmenu>
            </VStack>
          </Dropdown>
        </HStack>
      </VStack>

      <div class="w-full h-px bg-white/20"></div>

      <Button
        class="dark:bg-red-500 bg-red-500 hover:bg-red-600 dark:hover:bg-red-600 text-white"
        @click="multiplayer.room.leave"
      >
        <template #start>
          <Icon :path="departure.icon" />
        </template>
        {{ departure.text }}
      </Button>
    </VStack>
  </Well>
</template>
