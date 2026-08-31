// the shell, product agnostic
export { useShell } from './useShell.ts';
export type {
  HistoryField,
  Shell,
  ProductControls,
  ShellOptions,
  TransitField,
} from './types.ts';

export type { ShellFlagOptions, ShellFlags } from './flags.ts';

export type {
  Gesture,
  HelpMenuEntry,
  HelpMenuGesture,
} from '../ui/help-menu/types.ts';

export { provideShell, useProvidedShell } from './context.ts';

export { manifests, products } from './manifests/index.ts';
export { productThumbnail } from './manifests/thumbnail.ts';
export type { ProductId } from './manifests/index.ts';
export type {
  ProductCard,
  ProductManifest,
  ProductNavigation,
  Thumbnail,
} from './manifests/types.ts';
