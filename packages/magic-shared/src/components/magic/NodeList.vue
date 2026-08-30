<script setup lang="ts">
  import { cn } from '@core/components/cn';

  import { onUnmounted, ref, toRefs, watch } from 'vue';

  import { useHighlightState } from '../../component-slot/useHighlightState.ts';
  import VStack from '../layout/VStack.vue';
  import Well from '../layout/Well.vue';
  import Node from './Node.vue';

  // the panel slides and repositions itself, so the highlight ring has to be
  // drawn on the panel directly rather than landing wherever the host's
  // automatic class fallthrough would put it
  defineOptions({ inheritAttrs: false });

  /** matches the leave duration in the style block below + 250ms for a breather gap */
  const NODE_EXIT_MS = 350 + 100;

  const props = withDefaults(
    defineProps<{
      ids: readonly string[];
      title?: string;
      /** which edge the panel slides out past when the list empties */
      exitSide?: 'left' | 'right';
    }>(),
    { exitSide: 'right' },
  );

  const highlight = useHighlightState();

  const { ids: nodeIds } = toRefs(props);

  const panelVisible = ref(nodeIds.value.length > 0);
  let hideTimeout: ReturnType<typeof setTimeout> | undefined;

  /*
    the panel outlives the last node by exactly one exit. tying it straight to
    emptiness unmounted the node along with its container, which killed the drop
    animation rather than delaying it: a leaving parent freezes its subtree, so
    the node never got the chance to fall out of the box it was falling out of
  */
  watch(nodeIds, (next) => {
    clearTimeout(hideTimeout);

    if (next.length > 0) {
      panelVisible.value = true;
      return;
    }

    hideTimeout = setTimeout(() => {
      panelVisible.value = false;
    }, NODE_EXIT_MS);
  });

  onUnmounted(() => clearTimeout(hideTimeout));

  const exitDirection = ref<'down' | 'up'>('down');
  const enterDirection = ref<'down' | 'up'>('down');

  /*
    neither end of the queue is fixed once the playhead can run backwards.
    playing forward, shift() takes the front and push() adds to the back, so
    nodes drop out the bottom and fall in from the top. scrubbing backwards
    undoes both: an undone enqueue takes the back, and an undone dequeue
    unshifts onto the front. a node has to enter and leave through the end it
    actually belongs to, or the animation claims the traversal did something it
    never did

    both directions are read off the diff rather than the playhead, so a jump
    across several frames still resolves to the end that actually changed. sync
    flush lands them before the patch that starts the transitions
  */
  watch(
    nodeIds,
    (next, previous) => {
      const before = previous ?? [];

      const frontLeft = before[0] !== undefined && !next.includes(before[0]);
      exitDirection.value = frontLeft ? 'down' : 'up';

      /*
        an unshift belongs to the bottom of the column, which is where it will
        sit. arriving from below means the nodes already in line get pushed up
        ahead of it rather than shoved aside by something falling past them
      */
      const frontGained = next[0] !== undefined && !before.includes(next[0]);
      enterDirection.value = frontGained ? 'up' : 'down';
    },
    { flush: 'sync' },
  );

  /** how far past the edge a node sits when off camera */
  const CLEARANCE_PX = 64;

  /*
    every trip takes the same time, so what varies is how fast the node covers
    it. that only holds up once the distance is the real one: a declared offset
    is the same number for a node landing at the top of the column and one
    landing at the bottom, which makes the first cross a column it never needed
    to cross

    the distance is to whichever edge the node is crossing, measured against the
    scroll position rather than the content, since the edge that matters is the
    one the well clips at
  */
  const setTravel = (element: Element, edge: 'top' | 'bottom') => {
    const node = element as HTMLElement;
    const column = node.parentElement;
    if (!column) return;

    // offsetTop is layout, so the transform being set here does not feed back in
    const topWithinView = node.offsetTop - column.scrollTop;

    const distance =
      edge === 'top'
        ? topWithinView + node.offsetHeight + CLEARANCE_PX
        : column.clientHeight - topWithinView + CLEARANCE_PX;

    node.style.setProperty('--travel', `${distance}px`);
  };

  const onEnter = (element: Element) =>
    setTravel(element, enterDirection.value === 'down' ? 'top' : 'bottom');

  const onLeave = (element: Element) =>
    setTravel(element, exitDirection.value === 'up' ? 'top' : 'bottom');
</script>

<template>
  <!--
    an empty queue has nothing to say, so the whole panel leaves rather than
    sitting there as an empty box. it slides out past the edge it is anchored
    to, which is the caller's to name: the panel comes from the side it sits on,
    and a panel on the left sliding off to the right would cross the canvas
  -->
  <Transition
    name="panel"
    appear
  >
    <Well
      v-if="panelVisible || highlight?.isHighlighted"
      :class="
        cn(
          'queue-panel',
          exitSide === 'left' ? 'exit-left' : 'exit-right',
          highlight?.classes,
        )
      "
    >
      <span
        v-if="title"
        class="text-lg font-bold"
        >{{ title }}</span
      >
      <!--
        the box is fixed rather than sized to the contents, so the panel holds
        still while the queue drains and fills. a container that resized every
        frame would move the nodes around for reasons that have nothing to do
        with the traversal
      -->
      <VStack class="queue-box gap-2 items-center w-18">
        <!--
          keying each item by node id is what makes the animation smart: vue
          matches the ids across frames, so a shift() is a leave and everything
          behind it gets a FLIP move down. nothing here diffs the array by hand

          the column is reversed, so index 0 (the front) sits at the bottom and
          the scroller stays anchored there as the back grows past the cap
        -->
        <TransitionGroup
          name="queue"
          tag="div"
          appear
          class="queue-column relative flex flex-col-reverse items-center gap-2 h-full w-full overflow-y-auto"
          :class="[
            exitDirection === 'down' ? 'exit-down' : 'exit-up',
            enterDirection === 'down' ? 'enter-down' : 'enter-up',
          ]"
          @enter="onEnter"
          @leave="onLeave"
        >
          <Node
            v-for="nodeId in nodeIds"
            :key="nodeId"
            :id="nodeId"
            class="queue-item shrink-0"
          />
        </TransitionGroup>
      </VStack>
    </Well>
  </Transition>
</template>

<style scoped>
  /*
    the appear classes matter as much as the enter ones: the lens mounts with
    the start node already queued, so the panel's first showing is an initial
    render, which vue leaves unanimated unless asked

    the slide duration is a variable because the first node's drop waits on it.
    the nodes inherit it from the panel they sit in, so the two cannot drift
  */
  .queue-panel {
    --panel-slide: 250ms;
  }

  .panel-enter-active,
  .panel-appear-active,
  .panel-leave-active {
    transition: transform var(--panel-slide) cubic-bezier(0.34, 1.4, 0.64, 1);
  }

  /*
    the slot sits 1.5rem in from the edge, so clearing the panel's own width is
    not enough to get it off screen. the inset has to go too

    the sign is the only thing the side changes, so it is a variable rather than
    a second copy of the offset
  */
  .exit-right {
    --panel-exit: 1;
  }

  .exit-left {
    --panel-exit: -1;
  }

  .panel-enter-from,
  .panel-appear-from,
  .panel-leave-to {
    /* yona: adjusted this from (100% + 1.5rem) to (100% + 6rem) so it travels over the vertical space of the vertical AnnotationPanel if annotations are open */
    transform: translateX(calc(var(--panel-exit) * (100% + 6rem)));
  }

  /*
    a node on its way in or out is outside the column for most of the trip, and
    the column counts that as content it could scroll to. so every arrival and
    departure flashed a scrollbar, and since a scrolling axis forces the other
    one to match, the horizontal one came along with it

    the travel is real and cannot be given up, so the scrollbars go instead. the
    column still scrolls for a queue longer than the box, just without the
    chrome, and the horizontal axis is pinned shut since nothing here ever needs
    to scroll sideways
  */
  .queue-column {
    overflow-x: hidden;
    scrollbar-width: none;
  }

  .queue-column::-webkit-scrollbar {
    display: none;
  }

  .queue-item {
    transition: transform 200ms ease;
  }

  /*
    the column height is a variable rather than a utility class because the
    entrance is measured against it: a node starts a whole column away from its
    slot, which carries it past the edge no matter where in the column the slot
    sits, and the well's clipping hides it until it travels into view

    the clearance on top is what makes that reliable rather than marginal. a
    column exactly is only just enough for a slot at the far end of the content,
    and lands the node flush against the edge for any other slot, which is how
    it ended up starting inside the box. the extra puts it plainly outside

    an offset in percent would not work here at all: those resolve against the
    node's own height, so a short queue would start it mid box
  */
  /*
    --travel is written per node by the transition hooks. the
    fallbacks are what a node crossing the full column would get, so a trip that
    somehow starts unmeasured still clears the edge rather than stranding a node
    mid column
  */
  .queue-box {
    --column-height: 50vh;
    height: var(--column-height);
  }

  .enter-down .queue-enter-from {
    transform: translateY(calc(-1 * var(--travel, 50vh)));
  }

  /* the same trip from below, for a node unshifted onto the front. it rises
     through the bottom edge, retracing the drop it undoes */
  .enter-up .queue-enter-from {
    transform: translateY(var(--travel, 50vh));
  }

  /*
    arrivals and exits get longer than the 200ms a shuffle takes, because their
    distance is not ours to pick: a node has to reach the edge to be hidden, so
    with the duration pinned the speed follows from geometry. more time is the
    only way to slow the node down

    it stays a single duration rather than one scaled per trip, so a long trip
    still moves faster than a short one, just not by as much
  */
  .queue-enter-active,
  .queue-appear-active,
  .queue-leave-active {
    transition-duration: 350ms;
    transition-timing-function: cubic-bezier(0.2, 0.8, 0.2, 1);
  }

  /*
    the node that brings the panel back with it mounts alongside the panel, so
    without an appear it would ride in already seated. it always falls from the
    top, since a queue coming back from empty is being pushed to, and it waits
    out the panel's own slide first so it lands in a box that has stopped moving
  */
  .queue-appear-from {
    transform: translateY(calc(-1 * var(--travel, 50vh)));
  }

  .queue-appear-active {
    transition-delay: var(--panel-slide);
  }

  /*
    a dequeued node is pulled out of flow so the line closes into the gap during
    the exit rather than after it, and anchored to the bottom edge, which is the
    position the front of the queue already holds
  */
  .exit-down .queue-leave-active {
    position: absolute;
    bottom: 0;
  }

  .exit-down .queue-leave-to {
    transform: translateY(var(--travel, 50vh));
  }

  /*
    a node leaving the back stays in flow instead, and lifts out from wherever
    it is sitting. anchoring it to the top edge the way the front anchors to the
    bottom would teleport it up the column before it moved, since the back of a
    short queue is nowhere near the top edge. leaving it in place costs nothing:
    the column is anchored at the bottom, so the slot it vacates is the one the
    others are not standing on

    the lift is measured to the top edge, so the node is out of the box before
    it is dropped. its own height instead left it fading out mid column
  */
  .exit-up .queue-leave-to {
    transform: translateY(calc(-1 * var(--travel, 50vh)));
  }
</style>
