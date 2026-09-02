/*
  which graph elements the explainer is pointing at right now: a node ref lights
  itself, an edge ref lights itself and the nodes it runs between
*/
let highlighted: readonly string[] = [];

export const isHighlightedExplainerElement = (id: string) =>
  highlighted.includes(id);

export const setHighlightedExplainerElements = (ids: readonly string[]) => {
  highlighted = ids;
};

export const clearHighlightedExplainerElements = (ids: readonly string[]) => {
  if (highlighted === ids) highlighted = [];
};
