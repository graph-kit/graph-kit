import colors from '@core/utils/colors';
import { mdiCrown, mdiEye, mdiPencil, mdiShieldAccount } from '@mdi/js';
import {
  ASSIGNABLE_TIERS,
  AssignableTier,
  Tier,
  canSetTier,
} from '@multiplayer/protocol/tiers';

export const tierColor: Record<Tier, string> = {
  host: colors.BLUE_500,
  admin: colors.RED_500,
  write: colors.GREEN_500,
  read: colors.GRAY_500,
};

export const tierTooltip: Record<Tier, string> = {
  host: 'Role: Host',
  admin: 'Role: Admin',
  write: 'Role: Write',
  read: 'Role: Read',
};

export const tierIcon: Record<Tier, string> = {
  host: mdiCrown,
  admin: mdiShieldAccount,
  write: mdiPencil,
  read: mdiEye,
};

/** empty when this caller may change nothing, which is also the menu's cue to hide */
export const assignableTiersFor = (
  callerTier: Tier,
  targetTier: Tier,
): readonly AssignableTier[] =>
  ASSIGNABLE_TIERS.filter((tier) => canSetTier(callerTier, targetTier, tier));
