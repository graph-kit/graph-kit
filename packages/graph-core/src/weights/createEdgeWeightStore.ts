import { EventHub } from '@core/events/createEventHub';
import { nullThrows } from '@core/utils/assert';
import { getValue } from '@core/utils/maybeGetter/index';
import { reactiveMap } from '@reactive/primitives/index';
import Fraction from 'fraction.js';

import { CoreEventMap } from '../events.ts';
import { CoreOptions } from '../options.ts';
import { DEFAULT_WEIGHT } from './constants.ts';
import { EdgeWeightStoreControls } from './types.ts';

export const createEdgeWeightStore = (
  events: Pick<EventHub<CoreEventMap>, 'emit'>,
  options: CoreOptions,
): EdgeWeightStoreControls => {
  const edgeIdToEdgeWeight = reactiveMap<string, Fraction>();

  const getEdgeWeight: EdgeWeightStoreControls['get'] = (edgeId) => {
    nullThrows(
      edgeIdToEdgeWeight.get(edgeId),
      `could not resolve weight from edge with id ${edgeId}`,
    );
    return options.weighted ? edgeIdToEdgeWeight.get(edgeId)! : new Fraction(1);
  };

  const setEdgeWeights: EdgeWeightStoreControls['setMany'] = (updates) => {
    return updates.map(({ edgeId, update }) => {
      const currentWeight = getEdgeWeight(edgeId);
      const weight = getValue(update, currentWeight);
      edgeIdToEdgeWeight.set(edgeId, weight);
      return { edgeId, weight };
    });
  };

  return {
    get: getEdgeWeight,
    set: (update) => {
      const [entry] = setEdgeWeights([update]);
      events.emit('onEdgeWeightsCommitted', [entry]);
      return entry;
    },
    setMany: (updates) => {
      const entries = setEdgeWeights(updates);
      events.emit('onEdgeWeightsCommitted', entries);
      return entries;
    },
    _internal: {
      edgeIdToEdgeWeight,
      add: (edges) => {
        for (const { id, weight } of edges) {
          edgeIdToEdgeWeight.set(id, weight ?? DEFAULT_WEIGHT);
        }
      },
      remove: (edgeIds) => {
        for (const id of edgeIds) {
          edgeIdToEdgeWeight.delete(id);
        }
      },
    },
  };
};
