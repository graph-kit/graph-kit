import { MaybeRefOrGetter, computed, toValue } from 'vue';

type CellSize = 'xsmall' | 'small' | 'medium' | 'large';

export type MatrixDensity = {
  headerClass: string;
  dataClass: string;
  nodeScale: number;
};

const cellSizes: Record<CellSize, MatrixDensity> = {
  xsmall: {
    headerClass: 'size-6 text-xs',
    dataClass: 'size-6 max-w-6 text-xs',
    nodeScale: 0.325,
  },
  small: {
    headerClass: 'size-8 text-sm',
    dataClass: 'size-8 max-w-8 text-sm',
    nodeScale: 0.5,
  },
  medium: {
    headerClass: 'size-10',
    dataClass: 'size-10 max-w-10',
    nodeScale: 0.625,
  },
  large: {
    headerClass: 'size-12',
    dataClass: 'size-12 max-w-12',
    nodeScale: 0.75,
  },
};

const cellSizeFor = (nodeCount: number): CellSize =>
  nodeCount > 12
    ? 'xsmall'
    : nodeCount > 7
      ? 'small'
      : nodeCount > 5
        ? 'medium'
        : 'large';

export const useMatrixDensity = (nodeCount: MaybeRefOrGetter<number>) =>
  computed(() => cellSizes[cellSizeFor(toValue(nodeCount))]);
