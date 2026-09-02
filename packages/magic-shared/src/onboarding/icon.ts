/** an mdi path as a data url the image shape can load, its color baked in */
export const mdiImageUrl = (path: string, color: string) => {
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="${path}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
