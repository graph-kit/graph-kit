import type { MagicCanvasProps } from "@/canvas/types";
import { onClickOutside } from "@vueuse/core";
import { onBeforeUnmount, onMounted, ref } from "vue";

export const useCanvasFocus = (canvas: MagicCanvasProps['canvas']) => {
  const canvasFocused = ref(true);

  const blurCanvas = () => (canvasFocused.value = false);
  const focusCanvas = () => {
    const el = document.activeElement;
    if (el instanceof HTMLElement && typeof el.blur === "function") el.blur();
    canvasFocused.value = true;
  };

  onClickOutside(canvas, blurCanvas);

  onMounted(() => {
    if (!canvas.value) throw 'no canvas found'
    canvas.value.addEventListener('mousedown', focusCanvas)
  })

  onBeforeUnmount(() => {
    if (!canvas.value) throw 'no canvas found'
    canvas.value.removeEventListener('mousedown', focusCanvas)
  })

  return { canvasFocused }
}