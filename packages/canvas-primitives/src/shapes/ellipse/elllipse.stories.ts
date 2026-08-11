import type { Meta, StoryObj } from '@storybook/vue3-vite';

import {
  DEFAULT_STORIES,
  DOC_MARKING_DEFAULTS,
  createDocComponent,
} from '../../docs.ts';
import { ELLIPSE_SCHEMA_DEFAULTS } from './defaults.ts';
import { ellipse } from './index.ts';
import type { EllipseSchema } from './types.ts';

const Ellipse = createDocComponent<EllipseSchema>(ellipse);

const meta = {
  title: 'Shapes/Ellipse',
  component: Ellipse,
  args: {
    ...ELLIPSE_SCHEMA_DEFAULTS,
    fillColor: 'black',
    radiusX: 50,
    radiusY: 50,
    at: { x: 60, y: 60 },
    ...DOC_MARKING_DEFAULTS,
  },
} satisfies Meta<typeof Ellipse>;

export default meta;

type Story = StoryObj<typeof meta>;

const { basic, markings, text, stroke } = DEFAULT_STORIES;

export const Basic: Story = basic;

export const RadiusX: Story = {
  args: {
    radiusX: 100,
    at: { x: 110, y: 60 },
  },
};

export const RadiusY: Story = {
  args: {
    radiusY: 100,
    at: { x: 60, y: 110 },
  },
};

export const Markings: Story = markings;
export const WithText: Story = text;
export const WithStroke: Story = stroke;
