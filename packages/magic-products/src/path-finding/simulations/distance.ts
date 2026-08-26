import { GNode } from '@magic/shared/graph';
import Fraction from 'fraction.js';

/**
 * a distance is a sum of edge weights, so it is a fraction for the same reason
 * a weight is one: three hops of 1/3 have to land on exactly 1, and in floats
 * they land just under it, which is enough to pick the wrong shortest path.
 *
 * undefined is infinity, rather than a number, so that adding to a distance we
 * have not found yet is a type error instead of an Infinity in a table cell
 */
export type Distance = Fraction | undefined;

// because this function is also used in the UI, it can't leave the parsing up to the angle brackets, therefore has to use .toFraction()
export const formatDistance = (distance: Distance) =>
  distance === undefined ? '∞' : distance.toFraction();

/** the best known distance from one fixed source to every node */
export type DistanceRow = Readonly<Record<GNode['id'], Distance>>;

/** the best known distance between every ordered pair, keyed source then target */
export type DistanceMatrix = Readonly<Record<GNode['id'], DistanceRow>>;
