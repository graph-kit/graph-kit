/**
 * An mdi path as something the image shape can load. Its color is baked in, since the url
 * is handed over once and cannot follow the appearance the way the card around it does,
 * see {@link ICON_COLOR}
 */
export const mdiImageUrl = (path: string, color: string) => {
  // no padding baked in, the layout insets every image inside its tile the same way
  const svg = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"><path fill="${color}" d="${path}"/></svg>`;
  return `data:image/svg+xml,${encodeURIComponent(svg)}`;
};
