import { nullThrows } from '@core/utils/assert';
import { jsonClone } from '@core/utils/clone';
import { devWarning } from '@core/utils/debugging';
import { delta } from '@core/utils/delta/index';
import { DeepPartial } from 'ts-essentials';

import type {
  EverySchemaPropName,
  SchemaId,
  ShapeName,
} from '../../types/index.ts';
import { type GetAnimatedSchema, resolveSchemaWithDefaults } from '../index.ts';
import type { DefineTimeline } from '../timeline/define.ts';
import type { LooseSchema, LooseSchemaValue } from '../types.ts';
import { arrowAdd } from './arrow/add.ts';
import { arrowRemove } from './arrow/remove.ts';
import { circleAdd } from './circle/add.ts';
import { circleRemove } from './circle/remove.ts';
import {
  AUTO_ANIMATED_PROPERTIES,
  DEFAULT_AUTO_ANIMATE_DURATION_MS,
  GHOST_REDRAW,
} from './constants.ts';
import { AutoAnimateTimeline, LooseSchemaWithName } from './types.ts';

/**
 * a shape that was removed but is still mid-removal-animation
 */
export type GhostShape = {
  id: SchemaId;
  schema: LooseSchemaWithName;
  /**
   * shape's position among everything drawn during the
   * capture's "before" snapshot, so it can be redrawn in the right z-order
   * relative to shapes still being drawn normally
   */
  orderIndex: number;
};

type CreateTimelineValue = {
  startValue: LooseSchemaValue;
  endValue: LooseSchemaValue;
  schemaPropertyName: EverySchemaPropName;
};

type CaptureState = 'before' | 'after' | undefined;

export const createAutoAnimate = (
  defineTimeline: DefineTimeline,
  getAnimatedSchema: GetAnimatedSchema,
  stopAllAnimations: (shapeId: SchemaId) => void,
) => {
  let capturedSchemas: Map<SchemaId, LooseSchemaWithName> = new Map();
  let captureState: CaptureState;

  let animationDuration = DEFAULT_AUTO_ANIMATE_DURATION_MS;

  const snapshotMap: Map<
    SchemaId,
    Partial<{ before: LooseSchemaWithName; after: LooseSchemaWithName }>
  > = new Map();

  /** removed shapes that are still playing their remove animation */
  const ghosts: Map<SchemaId, GhostShape> = new Map();

  // position of each shape within the overall draw order captured during the
  // most recent "before" snapshot, used to place ghosts back in the right
  // z-order once they're no longer drawn as part of the normal draw pass.
  let beforeCaptureOrder: Map<SchemaId, number> = new Map();
  let beforeCaptureOrderCounter = 0;

  const createTimeline = (
    shapeName: ShapeName,
    values: CreateTimelineValue[],
  ) => {
    const startingValues: Record<string, LooseSchemaValue> = {};
    const endingValues: Record<string, LooseSchemaValue> = {};

    for (const value of values) {
      startingValues[value.schemaPropertyName] = value.startValue;
      endingValues[value.schemaPropertyName] = value.endValue;
    }

    return {
      forShapes: [shapeName],
      keyframes: [
        {
          progress: 0,
          properties: startingValues,
        },
        {
          progress: 1,
          properties: endingValues,
        },
      ],
    };
  };

  const runAnimation = (
    timeline: AutoAnimateTimeline<any>,
    schemaId: string,
    onOver?: () => void,
  ) => {
    // a shape can carry animations auto-animate never started itself.
    // replace it with the auto-animates timeline instead of running them in parallel.
    stopAllAnimations(schemaId);

    const { play } = defineTimeline({
      ...timeline,
      durationMs: animationDuration,
    });
    play({ shapeId: schemaId, runCount: 1, onOver });
  };

  return {
    /** how long an auto animated capture takes to play out, in ms */
    get animationDuration() {
      return animationDuration;
    },

    /**
     * sets how long an auto animated capture takes to play out.
     * animations already in flight keep the duration they started with
     */
    setAnimationDuration: (durationMs: number) => {
      if (!Number.isFinite(durationMs) || durationMs <= 0) {
        devWarning(
          `auto animate duration must be a positive number, got ${durationMs}. ignoring`,
        );
        return;
      }
      animationDuration = durationMs;
    },

    captureSchemaState: (schema: LooseSchema, shapeName: ShapeName) => {
      if (!captureState) return captureState;
      // we only care about capturing each schema once, the rest of the calls should be ignored
      if (capturedSchemas.has(schema.id)) return captureState;

      // a ghost redraws itself under the id of the shape it replaced, so the
      // marker rather than the id is what separates it from a shape the
      // consumer added back under that same id
      if (GHOST_REDRAW in schema) return captureState;

      let schemaWithDefaults = resolveSchemaWithDefaults(schema, shapeName);

      if (captureState === 'before') {
        beforeCaptureOrder.set(schema.id, beforeCaptureOrderCounter++);

        // use the shape's currently animating schema if there is one
        const animatedSchema = getAnimatedSchema(schema.id);
        if (animatedSchema) schemaWithDefaults = animatedSchema;
      }

      const capturedSchema = jsonClone({ ...schemaWithDefaults, shapeName });
      capturedSchemas.set(schema.id, capturedSchema);

      const shapeSchemaEntry = snapshotMap.get(schema.id) ?? {};
      snapshotMap.set(schema.id, {
        ...shapeSchemaEntry,
        [captureState]: capturedSchema,
      });
      return captureState;
    },

    /**
     * Captures a pair of "before" and "after" snapshots of the given shapes' schemas
     *
     * @example
     * const finalize = autoAnimate.captureFrame(() => draw());
     * mutateShapes();
     * finalize(); // triggers animation between captured states
     */
    captureFrame: (flushDraw: () => void) => {
      // clear any stale snapshots left over from previous abandoned frames
      snapshotMap.clear();

      const takeSnapshot = (state: 'before' | 'after') => {
        capturedSchemas = new Map();
        if (state === 'before') {
          beforeCaptureOrder = new Map();
          beforeCaptureOrderCounter = 0;
        }
        captureState = state;
        flushDraw();
        captureState = undefined;
      };

      takeSnapshot('before');

      return () => {
        takeSnapshot('after');

        const schemasCapturedInSnapshots = Array.from(snapshotMap).map(
          ([schemaId, snapshotStates]) => ({
            schemaId,
            beforeSchema: snapshotStates.before,
            afterSchema: snapshotStates.after,
          }),
        );

        for (const snapshot of schemasCapturedInSnapshots) {
          const { beforeSchema, afterSchema } = snapshot;

          // this shape was added during the snapshot
          if (!beforeSchema) {
            const schema = nullThrows(
              afterSchema,
              'after schema must be defined',
            );

            // shape is re-appearing while its remove animation is still playing
            const ghost = ghosts.get(schema.id);
            if (ghost) {
              const ghostLiveSchema = getAnimatedSchema(schema.id);

              if (!ghostLiveSchema) {
                devWarning(
                  `ghost ${schema.id} has no animation to clear it and would have outlived the shape it stood in for. dropping it`,
                );
                ghosts.delete(schema.id);
                continue;
              }

              // getAnimatedSchema returns a LooseSchema without shapeName,
              // re-attach it so its not caught as a diff
              const schemaDifference: DeepPartial<LooseSchemaWithName> | null =
                delta(
                  { ...ghostLiveSchema, shapeName: ghost.schema.shapeName },
                  schema,
                );

              // the ghosts schema and the freshly added shape do not share a common shape
              // which means we cannot animate between them
              if (schemaDifference?.shapeName) {
                devWarning(
                  'illegal shape name difference mid animation in shape with ID',
                  schema.id,
                );
                stopAllAnimations(schema.id);
                continue;
              }

              // it came back exactly as it left, so there is nothing to
              // animate and the removal just gets called off
              if (!schemaDifference) {
                stopAllAnimations(schema.id);
                continue;
              }

              const schemaPropNames = Object.keys(
                schemaDifference,
              ) as EverySchemaPropName[];
              const supportedSchemaProperties = schemaPropNames.filter((name) =>
                AUTO_ANIMATED_PROPERTIES.has(name),
              );
              const timelineValues = supportedSchemaProperties.map(
                (name): CreateTimelineValue => ({
                  schemaPropertyName: name,
                  startValue: ghostLiveSchema[name],
                  endValue: schema[name],
                }),
              );
              const timeline = createTimeline(schema.shapeName, timelineValues);
              runAnimation(timeline, schema.id);
              continue;
            }

            if (schema.shapeName === 'circle') {
              runAnimation(circleAdd, schema.id);
            }
            if (schema.shapeName === 'arrow') {
              runAnimation(arrowAdd, schema.id);
            }
            continue;
          }

          // this shape was removed: keep drawing it as a "ghost" from its last
          // known schema, in its original draw-order position, for the
          // duration of the remove animation
          if (!afterSchema) {
            ghosts.set(snapshot.schemaId, {
              id: snapshot.schemaId,
              schema: beforeSchema,
              orderIndex: nullThrows(
                beforeCaptureOrder.get(snapshot.schemaId),
                'did not capture order in snapshot',
              ),
            });

            const clearGhost = () => ghosts.delete(snapshot.schemaId);
            if (beforeSchema.shapeName === 'circle') {
              runAnimation(circleRemove, snapshot.schemaId, clearGhost);
            }
            if (beforeSchema.shapeName === 'arrow') {
              runAnimation(arrowRemove, snapshot.schemaId, clearGhost);
            }

            continue;
          }

          // if a shapes schema has not changed between snapshots, we dont need to animate it
          const schemaDifference: DeepPartial<LooseSchemaWithName> | null =
            delta(beforeSchema, afterSchema);

          // TODO known issue: only check for properties in the schema difference we care about
          // otherwise we could be starting an animation based on an unknown junk property
          if (!schemaDifference) continue;

          // animation between shapes is not supported
          const { shapeName } = schemaDifference;
          if (shapeName) {
            devWarning(
              `shape with ID ${snapshot.schemaId} changed from a ${beforeSchema.shapeName} to an ${afterSchema.shapeName}. Animating between shapes is unsupported`,
            );
            continue;
          }

          const schemaPropNames = Object.keys(
            schemaDifference,
          ) as EverySchemaPropName[];

          const supportedSchemaProperties = schemaPropNames.filter((name) =>
            AUTO_ANIMATED_PROPERTIES.has(name),
          );

          const timelineValues = supportedSchemaProperties.map(
            (name): CreateTimelineValue => ({
              schemaPropertyName: name,
              startValue: beforeSchema[name],
              endValue: afterSchema[name],
            }),
          );

          const timeline = createTimeline(
            afterSchema.shapeName,
            timelineValues,
          );

          runAnimation(timeline, afterSchema.id);
        }

        snapshotMap.clear();
      };
    },

    /**
     * shapes removed from the graph that are still playing their remove
     * animation, in their original draw-order position (ascending `orderIndex`).
     */
    getGhosts: (): GhostShape[] =>
      Array.from(ghosts.values()).sort((a, b) => a.orderIndex - b.orderIndex),

    /**
     * whether this schema is currently a ghost (removed from the graph but
     * still mid-removal-animation).
     */
    isGhost: (schemaId: SchemaId): boolean => ghosts.has(schemaId),
  };
};
