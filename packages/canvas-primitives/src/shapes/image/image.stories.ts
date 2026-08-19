import type { Meta, StoryObj } from '@storybook/vue3-vite';

import {
  DEFAULT_STORIES,
  DOC_MARKING_DEFAULTS,
  createDocComponent,
} from '../../docs.ts';
import { IMAGE_SCHEMA_DEFAULTS } from './defaults.ts';
import { image } from './index.ts';
import type { ImageSchema } from './types.ts';

const Image = createDocComponent<ImageSchema>(image);

const meta = {
  title: 'Shapes/Image',
  component: Image,
  args: {
    ...IMAGE_SCHEMA_DEFAULTS,
    width: 100,
    height: 100,
    src: '/favicons/magic-graphs-bg-gradient.svg',
    at: { x: 20, y: 20 },
    ...DOC_MARKING_DEFAULTS,
  },
} satisfies Meta<typeof Image>;

export default meta;

type Story = StoryObj<typeof meta>;

const { basic, markings, text, rotation } = DEFAULT_STORIES;

export const Basic: Story = basic;
export const Markings: Story = markings;
export const WithText: Story = text;
export const Rotation: Story = {
  args: {
    ...rotation.args,
    at: { x: 20, y: 20 },
  },
};
