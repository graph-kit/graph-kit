import { JoinResult } from '@multiplayer/protocol/events';
import { RoomId, RoomMembership } from '@multiplayer/protocol/room';

import { ProductId } from '../product/manifests/index.ts';
import { isProductId } from '../product/manifests/isValidProductId.ts';
import { getNavigationName } from '../product/manifests/navigationName.ts';
import {
  navigateToProduct,
  productHref,
} from '../ui/navigation-menu/navigateToProduct.ts';
import { toast } from '../ui/toast/useToastState.ts';
import { ConnectionControls, ProductBinding } from './types.ts';
import { jumpUserIdUrl } from './url.ts';

const STRANDED_TOAST_MS = 12_000;

type JoinAndFollowHostOptions = {
  actions: ConnectionControls['actions'];
  binding: ProductBinding;
  roomId: RoomId;
};

const hostProductIn = (membership: RoomMembership): ProductId | null => {
  const { hostId, roster } = membership.data;
  const hostProductId = roster[hostId]?.productId;
  return isProductId(hostProductId) ? hostProductId : null;
};

export const joinAndFollowHost = async ({
  actions,
  binding,
  roomId,
}: JoinAndFollowHostOptions): Promise<JoinResult> => {
  const joinRoomResult = await actions.room.join({ roomId });
  if (!joinRoomResult.joined) return joinRoomResult;

  const hostProduct = hostProductIn(joinRoomResult);
  const hostProductToFollow =
    hostProduct === binding.productId ? null : hostProduct;
  const joinedAsHost = joinRoomResult.data.hostId === joinRoomResult.userId;

  if (hostProductToFollow && !joinedAsHost) {
    const navigationFailed = await navigateToProduct(hostProductToFollow);
    if (!navigationFailed) return joinRoomResult;

    const hostProductName = getNavigationName(hostProductToFollow);

    toast.show({
      title: `The Session Host Is In ${hostProductName}`,
      severity: 'info',
      duration: STRANDED_TOAST_MS,
      buttons: [
        {
          textContent: `Jump To ${hostProductName}`,
          href: productHref(
            hostProductToFollow,
            jumpUserIdUrl.params(joinRoomResult.data.hostId),
          ),
        },
      ],
    });
  }

  await actions.product.enter(binding);

  return joinRoomResult;
};
