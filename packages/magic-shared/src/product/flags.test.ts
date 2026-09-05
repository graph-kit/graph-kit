import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveShellFlags } from './flags.ts';
import { ProductControls, TransitField } from './types.ts';

const transit: TransitField = { encode: () => ({}), decode: () => {} };

type Product = Pick<ProductControls, 'transit' | 'isContent'>;

const supporting: Product = { transit, isContent: () => true };
const stateless: Product = {};

const warnings = () => vi.spyOn(console, 'warn').mockImplementation(() => {});

afterEach(() => vi.restoreAllMocks());

describe('resolveShellFlags', () => {
  it('falls back to the defaults a product says nothing about', () => {
    expect(resolveShellFlags({}, supporting)).toEqual({
      history: true,
      localStorage: true,
      annotations: true,
      linkSharing: true,
      adjustAnimationSpeed: false,
      jumpToContent: true,
      onboarding: true,
    });
  });

  it('takes what the product asked for over the default', () => {
    const flags = resolveShellFlags(
      { history: false, annotations: false },
      supporting,
    );

    expect(flags.history).toBe(false);
    expect(flags.annotations).toBe(false);
    // untouched by the override
    expect(flags.linkSharing).toBe(true);
  });

  it('reads an explicit undefined as no opinion', () => {
    const flags = resolveShellFlags({ history: undefined }, supporting);
    expect(flags.history).toBe(true);
  });

  it('hands back a fresh object each time', () => {
    const flags = resolveShellFlags({}, supporting);
    flags.history = false;

    expect(resolveShellFlags({}, supporting).history).toBe(true);
  });

  describe('without product transit', () => {
    it('forces off the flags transit backs', () => {
      const flags = resolveShellFlags({}, stateless);

      expect(flags.localStorage).toBe(false);
      expect(flags.linkSharing).toBe(false);
    });

    it('leaves every other flag alone', () => {
      const flags = resolveShellFlags({ annotations: false }, stateless);

      expect(flags.history).toBe(true);
      expect(flags.annotations).toBe(false);
    });

    it('overrules a product that asked for one anyway', () => {
      warnings();

      const flags = resolveShellFlags({ linkSharing: true }, stateless);
      expect(flags.linkSharing).toBe(false);
    });

    it('warns about the flag it overruled', () => {
      const warn = warnings();

      resolveShellFlags({ localStorage: true }, stateless);

      expect(warn).toHaveBeenCalledOnce();
      expect(warn.mock.calls[0]?.[0]).toContain('localStorage');
    });

    it('stays quiet when the product only inherited the default', () => {
      const warn = warnings();

      resolveShellFlags({ annotations: true }, stateless);

      expect(warn).not.toHaveBeenCalled();
    });

    it('stays quiet when the product turned it off itself', () => {
      const warn = warnings();

      resolveShellFlags({ localStorage: false }, stateless);

      expect(warn).not.toHaveBeenCalled();
    });
  });

  describe('without product isContent', () => {
    it('forces off jump to content', () => {
      const flags = resolveShellFlags({}, { transit });

      expect(flags.jumpToContent).toBe(false);
    });

    it('overrules a product that asked for it anyway', () => {
      const warn = warnings();

      const flags = resolveShellFlags({ jumpToContent: true }, { transit });

      expect(flags.jumpToContent).toBe(false);
      expect(warn.mock.calls[0]?.[0]).toContain('jumpToContent');
    });

    it('leaves onboarding alone, which asks the product nothing', () => {
      const flags = resolveShellFlags({}, { transit });

      expect(flags.onboarding).toBe(true);
    });
  });

  it('warns about nothing when the product carries transit', () => {
    const warn = warnings();

    resolveShellFlags({ localStorage: true, linkSharing: true }, supporting);

    expect(warn).not.toHaveBeenCalled();
  });
});
