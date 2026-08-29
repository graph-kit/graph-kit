import { assert, nullThrows } from '@core/utils/assert';
import { devWarning } from '@core/utils/debugging';
import {
  compressToEncodedURIComponent,
  decompressFromEncodedURIComponent,
} from 'lz-string';

import { getNavigationName } from '../../product/manifests/navigationName.ts';
import { Shell } from '../../product/types.ts';
import { queryParam, stripQueryParam } from '../../url/index.ts';
import { toast } from '../toast/index.ts';

const sharePayloadQueryParam = 'share';

const MAX_PAYLOAD_CHARS = 2_600;

const PROBLEM_TOAST_MS = 6_000;

/** host provided a compressed encoding */
const HOST_SCHEME = 'c';
/** the shell encoded the url via the json fallback */
const JSON_SCHEME = 'j';

const transitOf = (shell: Shell) =>
  nullThrows(shell.transit, 'link sharing requires host transit');

const getLinkPayload = (shell: Shell) => {
  const { encode, compression } = transitOf(shell);
  const encoding = encode();

  const text = compression
    ? HOST_SCHEME + compression.compress(encoding)
    : JSON_SCHEME + JSON.stringify(encoding);

  return compressToEncodedURIComponent(text);
};

export type LinkResult =
  { success: true; link: string } | { success: false; reason: string };

export const getLink = (shell: Shell): LinkResult => {
  const payload = getLinkPayload(shell);

  if (payload.length > MAX_PAYLOAD_CHARS) {
    return {
      success: false,
      reason: 'There is too much on screen to fit into a link.',
    };
  }

  const query = `${sharePayloadQueryParam}=${payload}`;
  const { origin } = window.location;
  const { slug } = shell.manifest.navigation;
  return { success: true, link: `${origin}/${slug}?${query}` };
};

const readPayload = (shell: Shell, text: string) => {
  const { compression } = transitOf(shell);
  const scheme = text.slice(0, 1);

  if (scheme === HOST_SCHEME) {
    const host = nullThrows(
      compression,
      'link sharing: the link is compressed but the host cannot read it',
    );
    return host.decompress(text.slice(1));
  }

  return JSON.parse(scheme === JSON_SCHEME ? text.slice(1) : text);
};

export const loadFromLinkPayload = (shell: Shell) => {
  const payload = queryParam(sharePayloadQueryParam);
  if (!payload) return;

  stripQueryParam(sharePayloadQueryParam);

  try {
    const text = decompressFromEncodedURIComponent(payload);
    assert(text, 'link sharing: the query param is not a readable encoding');
    transitOf(shell).decode(readPayload(shell, text));
  } catch (err) {
    devWarning('link sharing: the link did not carry a readable payload', err);
    toast.show({
      title: 'Could Not Read The Link',
      description: `This link is not carrying anything ${getNavigationName(shell.manifest.id)} can read.`,
      severity: 'warn',
      duration: PROBLEM_TOAST_MS,
    });
  }
};
