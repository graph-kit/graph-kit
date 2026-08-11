import type { Meta, StoryObj } from '@storybook/vue3-vite';

import {
  DEFAULT_STORIES,
  DOC_MARKING_DEFAULTS,
  createDocComponent,
} from '../../docs.ts';
import { CIRCLE_SCHEMA_DEFAULTS } from './defaults.ts';
import { circle } from './index.ts';
import type { CircleSchema } from './types.ts';

const Circle = createDocComponent<CircleSchema>(circle);

const meta = {
  title: 'Shapes/Circle',
  component: Circle,
  args: {
    ...CIRCLE_SCHEMA_DEFAULTS,
    fillColor: 'black',
    radius: 50,
    at: { x: 60, y: 60 },
    ...DOC_MARKING_DEFAULTS,
  },
} satisfies Meta<typeof Circle>;

export default meta;

type Story = StoryObj<typeof meta>;

const { basic, markings, text, stroke } = DEFAULT_STORIES;

export const Basic: Story = basic;
export const Markings: Story = markings;
export const WithText: Story = text;
export const WithStroke: Story = stroke;
