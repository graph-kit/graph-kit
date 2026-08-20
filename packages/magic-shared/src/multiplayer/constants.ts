import { readLocalStorage } from '@core/utils/localStorage';

/** what a url driven join sends until the panel that owns the name mounts and renames */
const UNNAMED_DISPLAY_NAMES = [
  'Acyclic Aardvark',
  'Adjacent Alpaca',
  'Bipartite Bison',
  'Bridged Badger',
  'Complete Capybara',
  'Connected Coyote',
  'Cyclic Cheetah',
  'Dense Dormouse',
  'Directed Dingo',
  'Eulerian Emu',
  'Flowing Ferret',
  'Greedy Gopher',
  'Hamiltonian Hare',
  'Incident Ibex',
  'Isomorphic Iguana',
  'Labelled Lemur',
  'Minimal Marmot',
  'Ordered Otter',
  'Planar Pangolin',
  'Recursive Raccoon',
  'Rooted Rhino',
  'Spanning Sparrow',
  'Sparse Salamander',
  'Topological Toucan',
  'Traversed Tapir',
  'Undirected Urchin',
  'Visited Vulture',
  'Weighted Walrus',
];

const unnamedDisplayName = () =>
  UNNAMED_DISPLAY_NAMES.at(
    Math.floor(Math.random() * UNNAMED_DISPLAY_NAMES.length),
  ) ?? 'Error Prone Ostrich';

export const getDisplayName = () => {
  const displayName = readLocalStorage(DISPLAY_NAME_LOCAL_KEY);
  if (!displayName || displayName.trim().length === 0) {
    return unnamedDisplayName();
  }
  return displayName.trim();
};

/**
 * Marks a transaction as coming from the room, so the outbound handler doesn't re-broadcast it
 */
export const REMOTE_ORIGIN = Symbol('multiplayer/remote');

export const DISPLAY_NAME_LOCAL_KEY = 'multiplayer-display-name';
