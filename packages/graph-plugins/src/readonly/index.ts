import { createEventHub } from '@core/events/createEventHub';
import {
  PluginLifecycle,
  ReleaseSuppression,
} from '@graph/plugins-shared/lifecycle';

import { READONLY_SUPPRESSION_REASON } from './constants.ts';
import { createReadonlyEventRegistry } from './events.ts';
import { ReadonlyPlugin } from './types.ts';

/**
 * readonly holds every plugin that can originate a write disabled for as long as it is
 * entered. it suppresses rather than disables, so anything else that toggles those plugins
 * may go on doing so, and each one lands where its last caller asked once readonly exits.
 */
export const readonly: ReadonlyPlugin = ({ controls }) => {
  const events = createEventHub(createReadonlyEventRegistry());

  const writeSurface = {
    interactive: controls.interactive?.lifecycle,
    anchors: controls.anchors?.lifecycle,
    nodeDrag: controls.nodeDrag?.lifecycle,
    annotations: controls.annotations?.lifecycle,
    history: controls.history?.lifecycle,
  };

  const guarded = new Map<string, PluginLifecycle>();
  for (const [name, lifecycle] of Object.entries(writeSurface)) {
    if (lifecycle) guarded.set(name, lifecycle);
  }

  let releases: ReleaseSuppression[] = [];
  let active = false;

  const enter = () => {
    if (active) return;
    active = true;

    for (const lifecycle of guarded.values()) {
      releases.push(lifecycle.suppress(READONLY_SUPPRESSION_REASON));
    }

    events.emit('onReadonlyChange', true);
  };

  const exit = () => {
    if (!active) return;
    active = false;

    for (const release of releases) release();
    releases = [];

    events.emit('onReadonlyChange', false);
  };

  return {
    name: 'readonly',
    controls: {
      enter,
      exit,
      isActive: () => active,
      guarding: () => [...guarded.keys()],
      events,
    },
  };
};
