// reka measures the room the panel has left once it has flipped and shifted, so a panel
// with more content than that scrolls rather than running off the edge of the viewport
const availableHeightClasses =
  'max-h-[var(--reka-dropdown-menu-content-available-height)] overflow-y-auto';

// shared so a submenu panel is indistinguishable from the menu it opens out of
export const dropdownContentClasses = `z-50 min-w-48 rounded-md border border-neutral-200 bg-white p-1 shadow-md outline-none transition-[opacity,scale] duration-150 ease-[cubic-bezier(0.34,1.4,0.64,1)] starting:opacity-0 starting:scale-95 ${availableHeightClasses}`;
