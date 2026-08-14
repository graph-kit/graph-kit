import { PayloadId, ServerState } from '@multiplayer/protocol/server-state';

import { MultiplayerControls, MultiplayerSocket } from './types.ts';

const generatePayloadId = (): PayloadId => crypto.randomUUID();

export type PayloadSenders = Pick<
  MultiplayerControls,
  'sendOps' | 'sendReplacement'
>;

/** the two outbound writes, which differ only in what they put on the wire */
export const createPayloadSenders = (options: {
  requireSocket: () => MultiplayerSocket;
  canSend: () => boolean;
  encodeActiveState: () => ServerState;
}): PayloadSenders => {
  const { requireSocket, canSend, encodeActiveState } = options;

  return {
    sendOps: (productId, ops) => {
      if (!canSend() || ops.length === 0) return;

      requireSocket().emit('patchServerState', {
        payloadId: generatePayloadId(),
        productId,
        ops,
      });
    },

    sendReplacement: (productId) => {
      if (!canSend()) return;

      requireSocket().emit('replaceServerState', {
        payloadId: generatePayloadId(),
        productId,
        state: encodeActiveState(),
      });
    },
  };
};
