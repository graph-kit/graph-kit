import { afterEach, describe, expect, it, vi } from 'vitest';

import { resolveProductFlags } from './flags.ts';
import { MagicProductHost, TransitField } from './types.ts';

const transit: TransitField = { encode: () => ({}), decode: () => {} };

const hosting: Pick<MagicProductHost, 'transit'> = { transit };
const stateless: Pick<MagicProductHost, 'transit'> = {};

const warnings = () => vi.spyOn(console, 'warn').mockImplementation(() => {});

afterEach(() => vi.restoreAllMocks());

describe('resolveProductFlags', () => {
  it('falls back to the defaults a product says nothing about', () => {
    expect(resolveProductFlags({}, hosting)).toEqual({
      history: true,
      localStorage: true,
      annotations: true,
      linkSharing: true,
    });
  });

  it('takes what the product asked for over the default', () => {
    const flags = resolveProductFlags(
      { history: false, annotations: false },
      hosting,
    );

    expect(flags.history).toBe(false);
    expect(flags.annotations).toBe(false);
    // untouched by the override
    expect(flags.linkSharing).toBe(true);
  });

  it('reads an explicit undefined as no opinion', () => {
    const flags = resolveProductFlags({ history: undefined }, hosting);
    expect(flags.history).toBe(true);
  });

  it('hands back a fresh object each time', () => {
    const flags = resolveProductFlags({}, hosting);
    flags.history = false;

    expect(resolveProductFlags({}, hosting).history).toBe(true);
  });

  describe('without host transit', () => {
    it('forces off the flags transit backs', () => {
      const flags = resolveProductFlags({}, stateless);

      expect(flags.localStorage).toBe(false);
      expect(flags.linkSharing).toBe(false);
    });

    it('leaves every other flag alone', () => {
      const flags = resolveProductFlags({ annotations: false }, stateless);

      expect(flags.history).toBe(true);
      expect(flags.annotations).toBe(false);
    });

    it('overrules a product that asked for one anyway', () => {
      warnings();

      const flags = resolveProductFlags({ linkSharing: true }, stateless);
      expect(flags.linkSharing).toBe(false);
    });

    it('warns about the flag it overruled', () => {
      const warn = warnings();

      resolveProductFlags({ localStorage: true }, stateless);

      expect(warn).toHaveBeenCalledOnce();
      expect(warn.mock.calls[0]?.[0]).toContain('localStorage');
    });

    it('stays quiet when the product only inherited the default', () => {
      const warn = warnings();

      resolveProductFlags({ annotations: true }, stateless);

      expect(warn).not.toHaveBeenCalled();
    });

    it('stays quiet when the product turned it off itself', () => {
      const warn = warnings();

      resolveProductFlags({ localStorage: false }, stateless);

      expect(warn).not.toHaveBeenCalled();
    });
  });

  it('warns about nothing when the host carries transit', () => {
    const warn = warnings();

    resolveProductFlags({ localStorage: true, linkSharing: true }, hosting);

    expect(warn).not.toHaveBeenCalled();
  });
});
