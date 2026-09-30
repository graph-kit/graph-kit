import type { PartiallyRequired } from '@core/utils/types';
import type { Prettify } from 'ts-essentials';

import { resolveTextArea } from '../text/defaults.ts';
import type { TextArea } from '../types/schema.ts';

type WithDefaults<
  Schema extends TextArea,
  Defaults extends Record<string, unknown>,
> = Prettify<
  Omit<
    PartiallyRequired<Schema, Extract<keyof Defaults, keyof Schema>>,
    'textArea'
  > &
    Partial<NonNullable<ReturnType<typeof resolveTextArea>>>
>;

export const resolveDefaults =
  <TSchema extends TextArea, TDefaults extends Record<string, unknown>>(
    defaults: TDefaults,
  ) =>
  (schema: TSchema) => {
    const { textArea, ...rest } = schema;

    const cleanedRest = Object.fromEntries(
      Object.entries(rest).filter(
        ([key, value]) => !(key in defaults && value === undefined),
      ),
    );

    // typescript can't check a mapped type over a generic, so this is asserted
    return {
      ...defaults,
      ...resolveTextArea(textArea),
      ...cleanedRest,
    } as unknown as WithDefaults<TSchema, TDefaults>;
  };
