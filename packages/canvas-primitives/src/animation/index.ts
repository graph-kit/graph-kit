import { assert, nullThrows } from '@core/utils/assert';
import { devWarning } from '@core/utils/debugging';
import type { UnionToIntersection } from 'ts-essentials';

import { getSchemaWithDefaults } from '../defaults/shapes.ts';
import { drawGroup as drawGroupPure } from '../drawGroup.ts';
import { shapes } from '../index.ts';
import type {
  EverySchemaProp,
  EverySchemaPropName,
  SchemaId,
  Shape,
  ShapeFactory,
  ShapeName,
  ShapeNameToSchema,
  WithId,
} from '../types/index.ts';
import { shapeProps } from '../types/index.ts';
import { GHOST_REDRAW } from './auto-animate/constants.ts';
import { createAutoAnimate } from './auto-animate/createAutoAnimate.ts';
import type { DefineTimeline } from './timeline/define.ts';
import { createDefineTimeline } from './timeline/define.ts';
import type { ActiveAnimation, LooseSchema } from './types.ts';
import { getAnimationProgress, getCurrentRunCount } from './utils.ts';

export type ActiveAnimationsMap = Map<SchemaId, ActiveAnimation[]>;
export type GetAnimatedSchema = (schemaId: SchemaId) => LooseSchema | undefined;

/**
 * every shape factory, wrapped so the shape it produces resolves its
 * properties through whatever animations are running on that schema id
 */
export type AnimatedShapeFactories = {
  [TShape in ShapeName]: ShapeFactory<WithId<ShapeNameToSchema[TShape]>>;
};

/**
 * the frame lifecycle and timeline machinery that makes
 * {@link AnimatedShapeFactories} animate, held by whoever owns the draw loop
 */
export type ShapeRenderer = {
  /**
   * advances the animation clock to `now` and retires finished animations.
   * must run before the frame draws, since drawing is a pure read of its state
   */
  tick: (now: number) => void;
  /**
   * a `drawGroup` that also draws recently-removed shapes ("ghosts") in the
   * position they held before removal, until their remove animation ends
   */
  drawGroup: (ctx: CanvasRenderingContext2D, groupShapes: Shape[]) => void;
  /** resets the shape count `drawGroup` places ghosts against. once per frame */
  beginFrame: () => void;
  /**
   * draws any ghost whose priority tier had no live elements to splice it
   * into. call once per frame, after every `drawGroup`
   */
  endFrame: (ctx: CanvasRenderingContext2D) => void;
  /**
   * registers an animation that shapes can play by id
   */
  defineTimeline: DefineTimeline;
  autoAnimate: {
    /**
     * snapshots schemas either side of a mutation by invoking `flushDraw`
     * twice, animating the difference. returns the finalizer for the "after"
     */
    captureFrame: (flushDraw: () => void) => () => void;
    /** how long an auto animated capture takes to play out, in ms */
    readonly animationDuration: number;
    /**
     * sets how long an auto animated capture takes to play out.
     * animations already in flight keep the duration they started with
     */
    setAnimationDuration: (durationMs: number) => void;
  };
  /**
   * if a schema is actively being animated, the live schema with animated
   * props applied
   */
  getAnimatedSchema: GetAnimatedSchema;
  /**
   * the animated value of a single schema property, for imperative timelines
   * where one property depends on another and `getAnimatedSchema` would be
   * circular.
   *
   * WARNING: calling this on a property the imperative track itself resolves
   * will crash your app!
   */
  getAnimatedProp: <TProp extends EverySchemaPropName>(
    schemaId: SchemaId,
    inputPropName: TProp,
  ) => UnionToIntersection<EverySchemaProp>[TProp];
  /** shape ids to the animations currently running on them */
  activeAnimations: ActiveAnimationsMap;
};

/**
 * the factories and the renderer that drives them, created together because
 * they share the same active-animation state
 */
export type AnimatedShapes = {
  /**
   * drop-in replacements for the raw shape factories that animate themselves
   */
  shapes: AnimatedShapeFactories;
} & ShapeRenderer;

export const resolveSchemaWithDefaults = (
  schema: LooseSchema,
  shapeName: ShapeName,
) => {
  const defaultResolver = nullThrows(
    (getSchemaWithDefaults as any)?.[shapeName] as
      ((schema: LooseSchema) => LooseSchema) | undefined,
    `cant find defaults for ${shapeName}`,
  );
  return defaultResolver(schema);
};

/**
 * a version of the shape whose properties are all defined but whose draw
 * methods are no-ops
 */
const withoutDrawing = (shape: Shape): Shape => ({
  ...shape,
  draw: () => {},
  drawShape: () => {},
  drawText: () => {},
  drawTextArea: () => {},
  drawTextAreaHole: () => {},
  drawTextAreaMatte: () => {},
});

export const createAnimatedShapes = (): AnimatedShapes => {
  /** shape ids to the animations currently running on them */
  const activeAnimations: ActiveAnimationsMap = new Map();
  const schemaIdToShapeName: Map<SchemaId, ShapeName> = new Map();

  /** the one instant every property in the current frame resolves against */
  let frameNow = performance.now();

  const { defineTimeline, timelineIdToTimeline } = createDefineTimeline({
    play: ({
      shapeId,
      timelineId,
      synchronize,
      runCount = Infinity,
      onComplete,
      onOver,
    }) => {
      const newAnimation: ActiveAnimation = {
        runCount: synchronize ? Infinity : runCount,
        startedAt: synchronize ? 0 : frameNow,
        timelineId,
        onComplete,
        onOver,
      };

      const currAnimations = activeAnimations.get(shapeId);
      if (currAnimations) {
        currAnimations.push(newAnimation);
      } else {
        activeAnimations.set(shapeId, [newAnimation]);
      }
    },
    stop: ({ shapeId, timelineId }) => {
      const animations = activeAnimations.get(shapeId);
      if (!animations) return;

      const stopped = animations.filter((a) => a.timelineId === timelineId);
      const stillRunning = animations.filter(
        (a) => a.timelineId !== timelineId,
      );

      if (stillRunning.length === 0) activeAnimations.delete(shapeId);
      else activeAnimations.set(shapeId, stillRunning);

      for (const animation of stopped) animation.onOver?.();
    },
    pause: () => devWarning('not implemented'),
    resume: () => devWarning('not implemented'),
  });

  /** stops every animation on a shape, whichever timeline started it */
  const stopAllAnimations = (shapeId: SchemaId) => {
    const animations = activeAnimations.get(shapeId);
    activeAnimations.delete(shapeId);
    for (const animation of animations ?? []) animation.onOver?.();
  };

  const hasFinished = (animation: ActiveAnimation) => {
    const timeline = nullThrows(
      timelineIdToTimeline.get(animation.timelineId),
      'animation activated without a timeline!',
    );
    const runCount = getCurrentRunCount(
      { ...timeline, ...animation },
      frameNow,
    );
    return runCount >= animation.runCount;
  };

  const tick: ShapeRenderer['tick'] = (now) => {
    frameNow = now;

    const retired: ActiveAnimation[] = [];

    for (const [schemaId, animations] of [...activeAnimations]) {
      const stillRunning: ActiveAnimation[] = [];
      for (const animation of animations) {
        if (hasFinished(animation)) retired.push(animation);
        else stillRunning.push(animation);
      }

      if (stillRunning.length === animations.length) continue;
      if (stillRunning.length === 0) activeAnimations.delete(schemaId);
      else activeAnimations.set(schemaId, stillRunning);
    }

    for (const animation of retired) {
      animation.onComplete?.();
      animation.onOver?.();
    }
  };

  /**
   * if schema is actively being animated, returns the live schema with animated props applied.
   */
  const getAnimatedSchema: GetAnimatedSchema = (schemaId) => {
    const animations = activeAnimations.get(schemaId);
    if (!animations || animations.length === 0) return;

    let outputSchema = nullThrows(
      animations.at(0)?.schemaWithDefaults,
      'Animation set without a schema. this should never happen!',
    );

    const shapeName = nullThrows(
      schemaIdToShapeName.get(schemaId),
      'Animation set without shape name mapping. this should never happen!',
    );

    for (const animation of animations) {
      const timeline = nullThrows(
        timelineIdToTimeline.get(animation.timelineId),
        'Animation activated without a timeline!',
      );

      const animationWithTimeline = {
        ...timeline,
        ...animation,
      };

      const { validShapes, timelineId } = animationWithTimeline;
      if (!validShapes.has(shapeName)) {
        devWarning(
          `Attempted to apply inappropriate animation to schema! Animation timeline ${timelineId} only works for shapes ${Array.from(validShapes.keys())} but schema ${schemaId} is of shape ${shapeName}.`,
        );
        continue;
      }

      // resolve the properties for the animated shape schema
      const { properties } = animationWithTimeline;
      const progress = getAnimationProgress(animationWithTimeline, frameNow);

      const infusedProps = Object.entries(properties).reduce((acc, curr) => {
        const [propName, getAnimatedValue] = curr;
        acc[propName as EverySchemaPropName] = getAnimatedValue(
          outputSchema,
          progress,
        );
        return acc;
      }, {} as LooseSchema);

      outputSchema = {
        ...outputSchema,
        ...infusedProps,
      };
    }

    return outputSchema;
  };

  const autoAnimate = createAutoAnimate(
    defineTimeline,
    getAnimatedSchema,
    stopAllAnimations,
  );

  function animatedFactory<Schema extends Omit<LooseSchema, 'id'>>(
    factory: ShapeFactory<Schema>,
    shapeName: ShapeName,
  ): ShapeFactory<WithId<Schema>> {
    return (schema) =>
      new Proxy(factory(schema), {
        get: (target, rawProp) => {
          const prop = rawProp as keyof Shape;

          // if not a recognized shape property, return early
          if (!shapeProps.has(prop)) return target[prop];

          const captureState = autoAnimate.captureSchemaState(
            schema,
            shapeName,
          );
          if (captureState === 'after') return withoutDrawing(target)[prop];

          // lookup all actively running animations on this shape
          const animations = activeAnimations.get(schema.id);
          if (!animations || animations.length === 0) return target[prop];

          // lazily capture the baseline schema on the first render after the
          // animation started, since `play()` has no schema to stash it with
          if (!animations[0]?.schemaWithDefaults) {
            animations[0].schemaWithDefaults = resolveSchemaWithDefaults(
              schema,
              shapeName,
            );
          }

          if (prop === 'startTextAreaEdit') {
            devWarning(
              'Shapes with active animations cannot spawn text inputs',
            );
            return;
          }

          schemaIdToShapeName.set(schema.id, shapeName);

          const animatedSchema = nullThrows(
            getAnimatedSchema(schema.id),
            'Animations present but getAnimatedSchema returned nothing. this should never happen!',
          );

          return factory(animatedSchema as WithId<Schema>)[prop];
        },
      });
  }

  const animatedShapes: AnimatedShapeFactories = {
    arrow: animatedFactory(shapes.arrow, 'arrow'),
    circle: animatedFactory(shapes.circle, 'circle'),
    cross: animatedFactory(shapes.cross, 'cross'),
    ellipse: animatedFactory(shapes.ellipse, 'ellipse'),
    image: animatedFactory(shapes.image, 'image'),
    line: animatedFactory(shapes.line, 'line'),
    rect: animatedFactory(shapes.rect, 'rect'),
    scribble: animatedFactory(shapes.scribble, 'scribble'),
    square: animatedFactory(shapes.square, 'square'),
    star: animatedFactory(shapes.star, 'star'),
    triangle: animatedFactory(shapes.triangle, 'triangle'),
    uturn: animatedFactory(shapes.uturn, 'uturn'),
  };

  /**
   * rebuilds a `Shape` for each in-flight ghost from its last known schema, so
   * a remove animation stays visible after the caller stops asking for it
   */
  const getGhostShapes = (): {
    id: SchemaId;
    orderIndex: number;
    shape: Shape;
  }[] =>
    autoAnimate.getGhosts().map(({ id, schema, orderIndex }) => {
      const { shapeName, ...rest } = schema;
      return {
        id,
        orderIndex,
        shape: animatedShapes[shapeName]({
          ...rest,
          [GHOST_REDRAW]: true,
        } as WithId<any>),
      };
    });

  /**
   * `drawGroup` with in-flight ghosts spliced back into the position they held
   * before removal. it runs once per priority group, so ghosts are placed
   * against a count spanning the whole frame rather than one per call
   */
  let shapesDrawnThisFrame = 0;
  // a group's range is inclusive, so a ghost on a boundary matches more than
  // one of them. this keeps it claimed by the first
  const ghostsPlacedThisFrame = new Set<SchemaId>();
  const beginFrame = () => {
    shapesDrawnThisFrame = 0;
    ghostsPlacedThisFrame.clear();
  };

  const drawGroup = (ctx: CanvasRenderingContext2D, groupShapes: Shape[]) => {
    const groupStart = shapesDrawnThisFrame;
    const groupEnd = groupStart + groupShapes.length;

    const ghostsInGroup = getGhostShapes().filter(
      ({ id, orderIndex }) =>
        !ghostsPlacedThisFrame.has(id) &&
        orderIndex >= groupStart &&
        orderIndex <= groupEnd,
    );

    const shapesWithGhosts = [...groupShapes];
    for (const ghost of ghostsInGroup) {
      ghostsPlacedThisFrame.add(ghost.id);
      shapesWithGhosts.splice(
        Math.min(ghost.orderIndex - groupStart, shapesWithGhosts.length),
        0,
        ghost.shape,
      );
    }

    shapesDrawnThisFrame = groupEnd;
    drawGroupPure(ctx, shapesWithGhosts);
  };

  /**
   * draws any ghost no `drawGroup` claimed, which happens when its whole
   * priority tier is gone. call once per frame, after every `drawGroup`
   */
  const endFrame = (ctx: CanvasRenderingContext2D) => {
    const unclaimedGhosts = getGhostShapes().filter(
      ({ id }) => !ghostsPlacedThisFrame.has(id),
    );
    if (unclaimedGhosts.length === 0) return;

    for (const ghost of unclaimedGhosts) ghostsPlacedThisFrame.add(ghost.id);

    drawGroupPure(
      ctx,
      unclaimedGhosts
        .sort((a, b) => a.orderIndex - b.orderIndex)
        .map((ghost) => ghost.shape),
    );
  };

  return {
    shapes: animatedShapes,
    tick,
    drawGroup,
    beginFrame,
    endFrame,
    defineTimeline,
    autoAnimate: {
      captureFrame: autoAnimate.captureFrame,
      // forwarded as a getter so it tracks the live value instead of the one
      // that happened to be set when the renderer was created
      get animationDuration() {
        return autoAnimate.animationDuration;
      },
      setAnimationDuration: autoAnimate.setAnimationDuration,
    },
    getAnimatedSchema,
    getAnimatedProp: <TProp extends EverySchemaPropName>(
      schemaId: SchemaId,
      inputPropName: TProp,
    ) => {
      const animations = activeAnimations.get(schemaId) ?? [];
      assert(
        animations.length,
        `Schema with id ${schemaId} has no running animations`,
      );

      const schemaWithDefaults = nullThrows(
        animations[0].schemaWithDefaults,
        'Animation set without a schema. this should never happen!',
      );

      assert(
        inputPropName in schemaWithDefaults,
        `Prop name ${inputPropName} is not a property on schema (${Object.keys(schemaWithDefaults)})`,
      );

      const shapeName = nullThrows(
        schemaIdToShapeName.get(schemaId),
        'Animation set without shape name mapping. this should never happen!',
      );

      let propVal = schemaWithDefaults[
        inputPropName
      ] as UnionToIntersection<EverySchemaProp>[TProp];

      for (const animation of animations) {
        const timeline = nullThrows(
          timelineIdToTimeline.get(animation.timelineId),
          'Animation activated without a timeline!',
        );

        const animationWithTimeline = {
          ...timeline,
          ...animation,
        };

        const { validShapes, timelineId } = animationWithTimeline;
        if (!validShapes.has(shapeName)) {
          devWarning(
            `Attempted to apply inappropriate animation to schema! Animation timeline ${timelineId} only works for shapes ${Array.from(validShapes.keys())} but schema ${schemaId} is of shape ${shapeName}.`,
          );
          continue;
        }

        const { properties } = animationWithTimeline;
        const progress = getAnimationProgress(animationWithTimeline, frameNow);

        const animationFunction = properties[inputPropName as string];
        propVal = animationFunction(schemaWithDefaults, progress);
      }

      return propVal;
    },
    activeAnimations,
  };
};
