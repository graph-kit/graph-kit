import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveShellFlags } from './flags.ts';
import { ProductControls, TransitField } from './types.ts';

const transit: TransitField = { encode: () => ({}), decode: () => {} };

const hosting: Pick<ProductControls, 'transit'> = { transit };
const stateless: Pick<ProductControls, 'transit'> = {};

const warnings = () => vi.spyOn(console, 'warn').mockImplementation(() => {});

afterEach(() => vi.restoreAllMocks());

describe('resolveShellFlags', () => {
  it('falls back to the defaults a product says nothing about', () => {
    expect(resolveShellFlags({}, hosting)).toEqual({
      history: true,
      localStorage: true,
      annotations: true,
      linkSharing: true,
    });
  });

  it('takes what the product asked for over the default', () => {
    const flags = resolveShellFlags(
      { history: false, annotations: false },
      hosting,
    );

    expect(flags.history).toBe(false);
    expect(flags.annotations).toBe(false);
    // untouched by the override
    expect(flags.linkSharing).toBe(true);
  });

  it('reads an explicit undefined as no opinion', () => {
    const flags = resolveShellFlags({ history: undefined }, hosting);
    expect(flags.history).toBe(true);
  });

  it('hands back a fresh object each time', () => {
    const flags = resolveShellFlags({}, hosting);
    flags.history = false;

    expect(resolveShellFlags({}, hosting).history).toBe(true);
  });

  describe('without host transit', () => {
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

  it('warns about nothing when the host carries transit', () => {
    const warn = warnings();

    resolveShellFlags({ localStorage: true, linkSharing: true }, hosting);

    expect(warn).not.toHaveBeenCalled();
  });
});
