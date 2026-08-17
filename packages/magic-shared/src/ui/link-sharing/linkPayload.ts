import { nullThrows } from '@core/utils/assert';
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

import { Magic } from '../../product/types.ts';

const sharePayloadQueryParam = 'data';

// both sides are unreachable without transit, which is what gates the linkSharing flag
const transitOf = (magic: Magic) =>
  nullThrows(magic.transit, 'link sharing requires host transit');

const getLinkPayload = (magic: Magic) => {
  const encoding = transitOf(magic).encode();
  const stringEncoding = JSON.stringify(encoding);
  return compressToEncodedURIComponent(stringEncoding);
};

export const getLink = (magic: Magic) => {
  const { origin } = window.location;
  const { slug } = magic.manifest.navigation;
  const payload = getLinkPayload(magic);
  const query = `${sharePayloadQueryParam}=${payload}`;

  return `${origin}/${slug}?${query}`;
};

export const loadFromLinkPayload = (magic: Magic) => {
  const url = new URL(window.location.href);
  const payload = url.searchParams.get(sharePayloadQueryParam);
  if (!payload) return;

  // always consume or else users see stale when they refresh
  url.searchParams.delete(sharePayloadQueryParam);
  window.history.replaceState({}, '', url);

  const stringEncoding = decompressFromEncodedURIComponent(payload);
  if (!stringEncoding) return;

  const parsedEncoding = JSON.parse(stringEncoding);
  transitOf(magic).decode(parsedEncoding);
};
