import { nullThrows } from '@core/utils/assert';
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

import { Shell } from '../../product/types.ts';
import { queryParam, stripQueryParam } from '../../url/index.ts';

const sharePayloadQueryParam = 'data';

const MAX_PAYLOAD_CHARS = 2_600;

// both sides are unreachable without transit, which is what gates the linkSharing flag
const transitOf = (shell: Shell) =>
  nullThrows(shell.transit, 'link sharing requires host transit');

const getLinkPayload = (shell: Shell) => {
  const encoding = transitOf(shell).encode();
  const stringEncoding = JSON.stringify(encoding);
  return compressToEncodedURIComponent(stringEncoding);
};

export type LinkResult =
  { success: true; link: string } | { success: false; reason: string };

export const getLink = (shell: Shell): LinkResult => {
  const { origin } = window.location;
  const { slug } = shell.manifest.navigation;
  const payload = getLinkPayload(shell);

  if (payload.length > MAX_PAYLOAD_CHARS)
    return {
      success: false,
      reason: 'There is too much on screen to fit into a link.',
    };

  const query = `${sharePayloadQueryParam}=${payload}`;

  return { success: true, link: `${origin}/${slug}?${query}` };
};

export const loadFromLinkPayload = (shell: Shell) => {
  const payload = queryParam(sharePayloadQueryParam);
  if (!payload) return;

  // always consume or else users see stale when they refresh
  stripQueryParam(sharePayloadQueryParam);

  const stringEncoding = decompressFromEncodedURIComponent(payload);
  if (!stringEncoding) return;

  const parsedEncoding = JSON.parse(stringEncoding);
  transitOf(shell).decode(parsedEncoding);
};
