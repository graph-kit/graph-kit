//which graph element the explainer is highlighting right now,
let highlighted: string | undefined;

export const getHighlightedExplainerElement = () => highlighted;

export const setHighlightedExplainerElement = (id: string) => {
  highlighted = id;
};

export const clearHighlightedExplainerElement = (id: string) => {
  if (highlighted === id) highlighted = undefined;
};
