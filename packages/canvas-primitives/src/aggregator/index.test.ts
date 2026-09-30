import { describe, expect, it } from 'vitest';

import { createAggregator } from './index.ts';
import { AggregatorTransformer, CanvasElement } from './types.ts';

const rendererStub = {
  beginFrame: () => {},
  endFrame: () => {},
  drawGroup: () => {},
};

const element = (id: string, priority = 0) =>
  ({ id, priority, shape: {} }) as unknown as CanvasElement;

const pushing =
  (id: string, priority = 0): AggregatorTransformer =>
  (elements: CanvasElement[]) => {
    elements.push(element(id, priority));
    return elements;
  };

const setup = () => {
  const controls = createAggregator(rendererStub);
  const draw = () => {
    controls.draw({} as CanvasRenderingContext2D);
    return controls.elements().map(({ id }) => id);
  };
  return { ...controls, draw };
};

describe('addTransformer', () => {
  it('runs registered transformers in registration order', () => {
    const { addTransformer, draw } = setup();

    addTransformer(pushing('a'));
    addTransformer(pushing('b'));

    expect(draw()).toEqual(['a', 'b']);
  });

  it('threads the array a transformer returns into the next one', () => {
    const { addTransformer, draw } = setup();

    addTransformer(pushing('a'));
    addTransformer(pushing('b'));
    addTransformer((elements) => elements.filter(({ id }) => id !== 'a'));

    expect(draw()).toEqual(['b']);
  });
});

describe('removeTransformer', () => {
  it('stops running a removed transformer', () => {
    const { addTransformer, removeTransformer, draw } = setup();
    const transformer = pushing('a');

    addTransformer(transformer);
    addTransformer(pushing('b'));
    removeTransformer(transformer);

    expect(draw()).toEqual(['b']);
  });

  it('leaves the order of the remaining transformers untouched', () => {
    const { addTransformer, removeTransformer, draw } = setup();
    const transformer = pushing('b');

    addTransformer(pushing('a'));
    addTransformer(transformer);
    addTransformer(pushing('c'));
    removeTransformer(transformer);

    expect(draw()).toEqual(['a', 'c']);
  });

  it('is a no-op for a transformer that was never added', () => {
    const { addTransformer, removeTransformer, draw } = setup();

    addTransformer(pushing('a'));
    removeTransformer(pushing('b'));

    expect(draw()).toEqual(['a']);
  });

  it('removes a single registration of a transformer added twice', () => {
    const { addTransformer, removeTransformer, draw } = setup();
    const transformer = pushing('a');

    addTransformer(transformer);
    addTransformer(transformer);
    removeTransformer(transformer);

    expect(draw()).toEqual(['a']);
  });

  it('leaves the in flight pass untouched when a transformer removes another', () => {
    const { addTransformer, removeTransformer, draw } = setup();
    const last = pushing('c');

    addTransformer(pushing('a'));
    addTransformer((elements) => {
      removeTransformer(last);
      return elements;
    });
    addTransformer(last);

    expect(draw()).toEqual(['a', 'c']);
    expect(draw()).toEqual(['a']);
  });
});
