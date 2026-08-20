import colors from '@core/utils/colors';
import { mdiCrown, mdiPencil, mdiShieldAccount } from '@mdi/js';
import { Tier } from '@multiplayer/protocol/tiers';

export const tierColor: Record<Tier, string> = {
  host: colors.BLUE_500,
  admin: colors.RED_500,
  write: colors.GREEN_500,
};

export const tierTooltip: Record<Tier, string> = {
  host: 'Role: Host',
  admin: 'Role: Admin',
  write: 'Role: Write',
};

export const tierIcon: Record<Tier, string> = {
  host: mdiCrown,
  admin: mdiShieldAccount,
  write: mdiPencil,
};
