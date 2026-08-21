import { createLifecycle } from '@graph/plugins-shared/lifecycle';
import { describe, expect, it } from 'vitest';

import { readonly } from './index.ts';

const createWritePlugin = () => {
  const lifecycle = createLifecycle({
    onEnable: () => {},
    onDisable: () => {},
  });
  lifecycle.enable();
  return { lifecycle };
};

const setup = () => {
  const interactive = createWritePlugin();
  const anchors = createWritePlugin();
  const nodeDrag = createWritePlugin();

  const plugin = readonly({
    controls: { interactive, anchors, nodeDrag },
  } as Parameters<typeof readonly>[0]);

  return { ...plugin.controls, interactive, anchors, nodeDrag };
};

describe(readonly, () => {
  it('guards the write plugins the graph handed it', () => {
    const { guarding } = setup();
    expect(guarding()).toEqual(['interactive', 'anchors', 'nodeDrag']);
  });

  it('guards nothing it was not given', () => {
    const plugin = readonly({ controls: {} } as Parameters<typeof readonly>[0]);
    expect(plugin.controls.guarding()).toEqual([]);

    plugin.controls.enter();
    expect(plugin.controls.isActive()).toBe(true);
  });

  describe('enter', () => {
    it('disables every guarded plugin', () => {
      const { enter, interactive, anchors, nodeDrag } = setup();

      enter();

      expect(interactive.lifecycle.isEnabled()).toBe(false);
      expect(anchors.lifecycle.isEnabled()).toBe(false);
      expect(nodeDrag.lifecycle.isEnabled()).toBe(false);
    });

    it('holds them down against anything that enables mid-session', () => {
      const { enter, anchors } = setup();
      enter();

      anchors.lifecycle.enable();

      expect(anchors.lifecycle.isEnabled()).toBe(false);
      expect(anchors.lifecycle.suppressedBy()).toEqual(['readonly']);
    });

    it('ignores a second enter, so exit still releases', () => {
      const { enter, exit, anchors } = setup();

      enter();
      enter();
      exit();

      expect(anchors.lifecycle.isEnabled()).toBe(true);
    });
  });

  describe('exit', () => {
    it('hands each plugin back to what its last caller asked for', () => {
      const { enter, exit, interactive, anchors } = setup();
      enter();

      // a product turning a plugin off for its own reasons, mid readonly
      interactive.lifecycle.disable();

      exit();

      expect(anchors.lifecycle.isEnabled()).toBe(true);
      expect(interactive.lifecycle.isEnabled()).toBe(false);
    });

    it('does nothing when readonly was never entered', () => {
      const { exit, anchors } = setup();
      anchors.lifecycle.disable();

      exit();

      expect(anchors.lifecycle.isEnabled()).toBe(false);
    });
  });

  describe('events', () => {
    it('triggers onReadonlyChange on transitions only', () => {
      const { enter, exit, events } = setup();
      const changes: boolean[] = [];
      events.subscribe('onReadonlyChange', (isActive) =>
        changes.push(isActive),
      );

      enter();
      enter();
      exit();
      exit();

      expect(changes).toEqual([true, false]);
    });
  });
});
