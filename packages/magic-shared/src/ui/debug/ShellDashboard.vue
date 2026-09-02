<script setup lang="ts">
  import { computed, onBeforeUnmount } from 'vue';

  import type { SlotPosition } from '../../component-slot/types.ts';
  import { useProvidedShell } from '../../product/context.ts';
  import DebugMoreMenu from './shared/DebugMoreMenu.vue';
  import DebugPanel from './shared/DebugPanel.vue';
  import DebugRow from './shared/DebugRow.vue';
  import DebugSection from './shared/DebugSection.vue';
  import DebugStatus from './shared/DebugStatus.vue';
  import { LABEL, STATUS_CLASSES, VALUE } from './shared/classes.ts';

  const SLOTS_LISTED = 6;

  /** exhaustive, so a position added to SlotPosition has to pick its short form here */
  const POSITION_ABBREVIATION: Record<SlotPosition, string> = {
    'top-left': 'tl',
    'top-middle': 'tm',
    'top-right': 'tr',
    'center-left': 'cl',
    'center-right': 'cr',
    'bottom-left': 'bl',
    'bottom-middle': 'bm',
    'bottom-right': 'br',
  };

  const shell = useProvidedShell();

  const lens = computed(() => shell.lens.activeId.value ?? 'none');

  const annotations = computed(() => {
    if (!shell.annotations) return 'off';
    return shell.annotations.isActive.value
      ? shell.annotations.mode.value
      : 'idle';
  });

  const onboarding = computed(() => {
    if (!shell.onboarding) return 'off';
    return shell.onboarding.isActive.value ? 'open' : 'closed';
  });

  const simulation = computed(() => shell.simulation.current.value);

  const frame = computed(() => {
    const running = simulation.value;
    if (!running) return '';
    const { position } = running.playhead;
    const total = running.frameCount;
    // frameAt simulations generate on demand and so never declare an end
    return `${position + 1} / ${Number.isFinite(total) ? total : '∞'}`;
  });

  const room = computed(() => shell.multiplayer?.room.state.value);

  const slots = computed(() =>
    [...shell.componentSlots.entries.value].sort((previous, next) =>
      POSITION_ABBREVIATION[previous.position].localeCompare(
        POSITION_ABBREVIATION[next.position],
      ),
    ),
  );

  const listedSlots = computed(() => slots.value.slice(0, SLOTS_LISTED));

  /** every slot the shell registers shares a prefix that spends the whole column */
  const slotName = (id: string) => id.replace(/^shell\//, '');

  /*
    the red outline ComponentSlots.vue already draws around the highlighted slot, put
    to work: pointing at a row here says which chrome on screen that row is
  */
  const highlight = (id: string) => shell.componentSlots.setHighlighted(id);
  const clearHighlight = () => shell.componentSlots.clearHighlighted();

  onBeforeUnmount(clearHighlight);
</script>

<template>
  <DebugPanel title="Shell">
    <template #badge>
      <span :class="[VALUE, 'font-bold']">
        {{ shell.manifest.abbreviatedName }}
      </span>
    </template>

    <DebugSection title="Session">
      <DebugRow
        label="product"
        :title="shell.manifest.id"
      >
        {{ shell.manifest.id }}
      </DebugRow>
      <DebugRow
        label="lens"
        :title="lens"
      >
        {{ lens }}
      </DebugRow>
      <DebugRow label="annotations">{{ annotations }}</DebugRow>
      <DebugRow label="onboarding">{{ onboarding }}</DebugRow>
    </DebugSection>

    <DebugSection title="Simulation">
      <DebugRow label="state">
        <span v-if="simulation">running</span>
        <span
          v-else
          :class="LABEL"
        >
          idle
        </span>
      </DebugRow>
      <template v-if="simulation">
        <DebugRow label="frame">{{ frame }}</DebugRow>
        <DebugRow label="guard">
          <span
            v-if="simulation.violation"
            :class="STATUS_CLASSES.bad"
            :title="simulation.violation.id"
          >
            {{ simulation.violation.id }}
          </span>
          <span
            v-else
            :class="STATUS_CLASSES.good"
          >
            passing
          </span>
        </DebugRow>
      </template>
    </DebugSection>

    <DebugSection title="History">
      <template v-if="shell.history">
        <DebugStatus
          label="undo"
          :is-on="shell.history.canUndo.value"
        />
        <DebugStatus
          label="redo"
          :is-on="shell.history.canRedo.value"
        />
        <DebugRow
          v-if="shell.history.suppression.value"
          label="blocked"
          :title="shell.history.suppression.value"
        >
          {{ shell.history.suppression.value }}
        </DebugRow>
      </template>
      <DebugRow
        v-else
        label="state"
      >
        <span :class="LABEL">off</span>
      </DebugRow>
    </DebugSection>

    <DebugSection title="Room">
      <DebugRow label="state">
        <span v-if="room?.connected">connected</span>
        <span
          v-else
          :class="LABEL"
        >
          {{ shell.multiplayer ? 'offline' : 'off' }}
        </span>
      </DebugRow>
      <template v-if="room?.connected">
        <DebugRow
          label="id"
          :title="room.id"
        >
          {{ room.id }}
        </DebugRow>
        <DebugRow label="roster">
          {{ Object.keys(room.userIdToRosterEntry).length }}
          <span :class="LABEL">
            / {{ Object.keys(room.userIdToPresence).length }} here
          </span>
        </DebugRow>
        <DebugStatus
          label="readonly"
          :is-on="shell.multiplayer?.room.isReadonly.value ?? false"
        />
      </template>
    </DebugSection>

    <DebugSection title="Slots">
      <DebugRow
        v-for="{ id, position } of listedSlots"
        :key="id"
        :label="POSITION_ABBREVIATION[position]"
        :title="id"
        fixed-label
        class="cursor-crosshair"
        @mouseenter="highlight(id)"
        @mouseleave="clearHighlight()"
      >
        {{ slotName(id) }}
      </DebugRow>
      <!-- the menu has the room the column does not, so it lists every slot by its full id -->
      <DebugMoreMenu :count="slots.length - listedSlots.length">
        <DebugRow
          v-for="{ id, position } of slots"
          :key="id"
          :label="POSITION_ABBREVIATION[position]"
          fixed-label
          class="cursor-crosshair"
          @mouseenter="highlight(id)"
          @mouseleave="clearHighlight()"
        >
          {{ id }}
        </DebugRow>
      </DebugMoreMenu>
    </DebugSection>
  </DebugPanel>
</template>
