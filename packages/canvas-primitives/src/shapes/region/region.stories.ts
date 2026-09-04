import type { Meta, StoryObj } from '@storybook/vue3-vite';

import {
  DEFAULT_STORIES,
  DOC_MARKING_DEFAULTS,
  createDocComponent,
} from '../../docs.ts';
import { region } from './index.ts';
import type { RegionMember, RegionSchema } from './types.ts';

const Region = createDocComponent<RegionSchema>(region);

const bounds = { at: { x: 0, y: 0 }, width: 300, height: 220 };

const left: RegionMember = {
  shape: 'circle',
  at: { x: 120, y: 110 },
  radius: 70,
};
const right: RegionMember = {
  shape: 'circle',
  at: { x: 180, y: 110 },
  radius: 70,
};

const meta = {
  title: 'Shapes/Region',
  component: Region,
  args: {
    bounds,
    inside: [left, right],
    outside: [],
    fillColor: 'black',
    ...DOC_MARKING_DEFAULTS,
  },
} satisfies Meta<typeof Region>;

export default meta;

type Story = StoryObj<typeof meta>;

const { basic, markings } = DEFAULT_STORIES;

/** where both circles overlap, and nothing else */
export const Basic: Story = basic;
export const Markings: Story = markings;

/** the left circle alone: inside it, outside its neighbour */
export const Difference: Story = {
  args: { inside: [left], outside: [right] },
};

/** everything the circles do not cover, which is what an empty `inside` means */
export const OutsideEverything: Story = {
  args: { inside: [], outside: [left, right] },
};

/** two circles at the same centre make an annulus, so a ring is hit testable */
export const Annulus: Story = {
  args: {
    inside: [{ shape: 'circle', at: { x: 150, y: 110 }, radius: 80 }],
    outside: [{ shape: 'circle', at: { x: 150, y: 110 }, radius: 60 }],
  },
};

/** a hatch reads as more than one thing selecting the same region */
export const Hatched: Story = {
  args: {
    fillHatch: { colors: ['#ef4444', '#3b82f6', '#10b981'] },
  },
};

export const MixedMembers: Story = {
  args: {
    inside: [
      { shape: 'rect', at: { x: 60, y: 50 }, width: 180, height: 120 },
      { shape: 'circle', at: { x: 150, y: 110 }, radius: 80 },
    ],
    outside: [
      {
        shape: 'triangle',
        pointA: { x: 150, y: 60 },
        pointB: { x: 110, y: 140 },
        pointC: { x: 190, y: 140 },
      },
    ],
  },
};
