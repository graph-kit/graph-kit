import { describe, expect, it, vi } from 'vitest';

import { createLifecycle } from './createLifecycle.ts';

const setup = () => {
  const onEnable = vi.fn();
  const onDisable = vi.fn();
  const lifecycle = createLifecycle({ onEnable, onDisable });
  return { lifecycle, onEnable, onDisable };
};

describe(createLifecycle, () => {
  it('starts disabled', () => {
    const { lifecycle, onEnable } = setup();
    expect(lifecycle.isEnabled()).toBe(false);
    expect(onEnable).not.toHaveBeenCalled();
  });

  describe('enable and disable', () => {
    it('runs the handlers on a transition', () => {
      const { lifecycle, onEnable, onDisable } = setup();

      lifecycle.enable();
      expect(lifecycle.isEnabled()).toBe(true);
      expect(onEnable).toHaveBeenCalledTimes(1);

      lifecycle.disable();
      expect(lifecycle.isEnabled()).toBe(false);
      expect(onDisable).toHaveBeenCalledTimes(1);
    });

    it('ignores a repeat call that changes nothing', () => {
      const { lifecycle, onEnable, onDisable } = setup();

      lifecycle.enable();
      lifecycle.enable();
      expect(onEnable).toHaveBeenCalledTimes(1);

      lifecycle.disable();
      lifecycle.disable();
      expect(onDisable).toHaveBeenCalledTimes(1);
    });
  });

  describe('suppress', () => {
    it('disables a live plugin and reports the reason', () => {
      const { lifecycle, onDisable } = setup();
      lifecycle.enable();

      lifecycle.suppress('readonly');

      expect(lifecycle.isEnabled()).toBe(false);
      expect(onDisable).toHaveBeenCalledTimes(1);
      expect(lifecycle.suppressedBy()).toEqual(['readonly']);
    });

    it('holds enable off without a window where the plugin is live', () => {
      const { lifecycle, onEnable } = setup();
      lifecycle.suppress('readonly');

      lifecycle.enable();

      expect(lifecycle.isEnabled()).toBe(false);
      expect(onEnable).not.toHaveBeenCalled();
    });

    it('hands the plugin back to what the last caller asked for', () => {
      const { lifecycle, onEnable } = setup();
      const release = lifecycle.suppress('readonly');
      lifecycle.enable();

      release();

      expect(lifecycle.isEnabled()).toBe(true);
      expect(onEnable).toHaveBeenCalledTimes(1);
    });

    it('leaves a plugin disabled if that is what the last caller asked for', () => {
      const { lifecycle, onEnable } = setup();
      lifecycle.enable();
      const release = lifecycle.suppress('readonly');
      lifecycle.disable();

      release();

      expect(lifecycle.isEnabled()).toBe(false);
      expect(onEnable).toHaveBeenCalledTimes(1);
    });

    it('stays suppressed until the last owner releases', () => {
      const { lifecycle } = setup();
      lifecycle.enable();
      const releaseReadonly = lifecycle.suppress('readonly');
      const releaseSimulation = lifecycle.suppress('simulation');

      releaseReadonly();
      expect(lifecycle.isEnabled()).toBe(false);
      expect(lifecycle.suppressedBy()).toEqual(['simulation']);

      releaseSimulation();
      expect(lifecycle.isEnabled()).toBe(true);
    });

    it('ignores a release called more than once', () => {
      const { lifecycle } = setup();
      lifecycle.enable();
      const release = lifecycle.suppress('readonly');
      lifecycle.suppress('simulation');

      release();
      release();

      expect(lifecycle.suppressedBy()).toEqual(['simulation']);
      expect(lifecycle.isEnabled()).toBe(false);
    });
  });

  describe('events', () => {
    it('triggers on transitions only', () => {
      const { lifecycle } = setup();
      const onEnabled = vi.fn();
      const onDisabled = vi.fn();
      lifecycle.events.subscribe('onEnabled', onEnabled);
      lifecycle.events.subscribe('onDisabled', onDisabled);

      lifecycle.enable();
      lifecycle.enable();
      expect(onEnabled).toHaveBeenCalledTimes(1);

      const release = lifecycle.suppress('readonly');
      expect(onDisabled).toHaveBeenCalledTimes(1);

      release();
      expect(onEnabled).toHaveBeenCalledTimes(2);
    });
  });
});
