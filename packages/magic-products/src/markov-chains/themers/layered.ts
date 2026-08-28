import { Lens } from '@magic/shared/lens/types';
import { Themer } from '@magic/shared/theme';

/** runs several themers as one lens, so a text themer can sit over a color one */
export const layered = (
  ...themers: Themer[]
): Pick<Lens, 'activate' | 'deactivate'> => ({
  activate: () => {
    for (const themer of themers) themer.activate();
  },
  deactivate: () => {
    for (const themer of themers) themer.deactivate();
  },
});
