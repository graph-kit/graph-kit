import { createEventHub } from '@core/events/createEventHub';
import { createLifecycle } from '@graph/plugins-shared/lifecycle';

import { MAX_HISTORY, PLUGINS_EXCLUDED_FROM_HISTORY } from './constants.ts';
import { createHistoryEventRegistry } from './events.ts';
import { HistoryPlugin } from './types.ts';

/**
 * history is a list of whole graph snapshots plus a cursor, not a stack of inverse
 * actions. the reason is plugin owned state: a node's label lives in nodeLabel rather
 * than on the node, so an inverse of `removeNode` written here could never restore it,
 * and it gets worse with every plugin (third party ones included) that widens nodes and
 * edges through getters. `finalTransit` already asks every plugin to encode and decode
 * the state it owns, so a snapshot preserves all of it without history having to know
 * what any of it is.
 */
export const history: HistoryPlugin = ({ finalTransit }) => {
  const historyRegistry = createHistoryEventRegistry();
  const historyEventHub = createEventHub(historyRegistry);

  /**
   * snapshots are held serialized. transit payloads are JSON round trip safe by design
   * (they are what a share link puts on the wire), and keeping the string makes the
   * identical-state check in `commit` a cheap compare rather than a deep diff.
   */
  const snapshots: string[] = [];
  /** index of the snapshot the graph is currently sitting at */
  let cursor = -1;
  let capturePending = false;

  const lifecycle = createLifecycle({
    // toggling changes what canUndo and canRedo answer, so it goes out as a history
    // change too. consumers that cache those answers off the event (graph-vue) would
    // otherwise keep offering an undo that no longer does anything.
    onEnable: () => historyEventHub.emit('onHistoryChanged'),
    // records already held survive, they are just unreachable until re-enabled
    onDisable: () => historyEventHub.emit('onHistoryChanged'),
  });

  lifecycle.enable();

  const withoutExcludedPlugins = (payload: Record<string, unknown>) => {
    const result = { ...payload };
    for (const pluginName of PLUGINS_EXCLUDED_FROM_HISTORY) {
      delete result[pluginName];
    }
    return result;
  };

  const encodeCurrentState = () =>
    JSON.stringify(withoutExcludedPlugins(finalTransit.encode()));

  const commit = () => {
    const encoded = encodeCurrentState();

    // an encoding identical to where the cursor already sits is not a new state. this
    // is also what makes `restore` safe: decoding may prompt a plugin to ask for a
    // snapshot, and that request lands here as a no-op rather than recording the undo
    // itself as a new state and truncating the future it just walked into.
    if (encoded === snapshots[cursor]) return;

    // anything above the cursor belongs to a branch the graph walked away from on undo.
    // left in place it stays reachable via redo, which would send the graph into a
    // state the current one never came from.
    snapshots.splice(cursor + 1);
    snapshots.push(encoded);
    if (snapshots.length > MAX_HISTORY) snapshots.shift();
    cursor = snapshots.length - 1;

    historyEventHub.emit('onHistoryChanged');
  };

  const captureSnapshot = () => {
    if (!lifecycle.isEnabled() || capturePending) return;
    capturePending = true;
    // one gesture routinely touches several plugins, each of which asks for a snapshot.
    // deferring to the end of the tick collapses them into a single record by
    // construction, so no caller has to coordinate with any other.
    queueMicrotask(() => {
      capturePending = false;
      commit();
    });
  };

  const restore = (index: number) => {
    const snapshot = snapshots.at(index);
    if (snapshot === undefined) return false;

    const payload = JSON.parse(snapshot) as Record<string, unknown>;

    // snapshots carry no slice at all for excluded plugins, so fill them in from live
    // state. decode validates and writes every registered plugin unconditionally, so an
    // absent key would arrive at that plugin's decode as undefined.
    const liveState = finalTransit.encode();
    for (const pluginName of PLUGINS_EXCLUDED_FROM_HISTORY) {
      payload[pluginName] = liveState[pluginName];
    }

    // moved ahead of the decode so a snapshot requested in response to it compares
    // against the slot the graph is arriving at
    cursor = index;
    finalTransit.decode(payload);

    return true;
  };

  const canUndo = () => lifecycle.isEnabled() && cursor > 0;
  const canRedo = () => lifecycle.isEnabled() && cursor < snapshots.length - 1;

  const undo = () => {
    if (!canUndo()) return;
    if (!restore(cursor - 1)) return;
    historyEventHub.emit('onUndo');
    historyEventHub.emit('onHistoryChanged');
  };

  const redo = () => {
    if (!canRedo()) return;
    if (!restore(cursor + 1)) return;
    historyEventHub.emit('onRedo');
    historyEventHub.emit('onHistoryChanged');
  };

  const clear = () => {
    snapshots.length = 0;
    snapshots.push(encodeCurrentState());
    cursor = snapshots.length - 1;
    historyEventHub.emit('onHistoryChanged');
  };

  // the starting point. deferred rather than run here or in onAfterInit because
  // `finalTransit` does not resolve until folding finishes. queuing it during fold
  // guarantees it lands before any snapshot a consumer could ask for.
  captureSnapshot();

  return {
    name: 'history',
    controls: {
      captureSnapshot,
      undo,
      redo,
      canUndo,
      canRedo,
      clear,
      recordCount: () => snapshots.length,
      events: historyEventHub,
      lifecycle,
    },
  };
};
