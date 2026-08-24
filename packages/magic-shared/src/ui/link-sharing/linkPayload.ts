import { nullThrows } from '@core/utils/assert';
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

import { Shell } from '../../product/types.ts';
import { queryParam, stripQueryParam } from '../../url/index.ts';

const sharePayloadQueryParam = 'data';

// both sides are unreachable without transit, which is what gates the linkSharing flag
const transitOf = (shell: Shell) =>
  nullThrows(shell.transit, 'link sharing requires host transit');

const getLinkPayload = (shell: Shell) => {
  const encoding = transitOf(shell).encode();
  const stringEncoding = JSON.stringify(encoding);
  return compressToEncodedURIComponent(stringEncoding);
};

export const getLink = (shell: Shell) => {
  const { origin } = window.location;
  const { slug } = shell.manifest.navigation;
  const payload = getLinkPayload(shell);
  const query = `${sharePayloadQueryParam}=${payload}`;

  return `${origin}/${slug}?${query}`;
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
