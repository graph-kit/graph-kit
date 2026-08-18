import { AnnotationsControls } from '@core/annotations/index';
import { useSignals } from '@graph/vue/utils/useSignal';

/**
 * the one place annotations become vue. the engine is pull based like the rest of the
 * sdk and the chrome around it is a template, so the bridge sits here rather than in
 * every component that wants to read a mode or a color.
 *
 * host agnostic on purpose: whatever hands the harness its annotations gets the same
 * toggle and island, graph or not.
 */
export const useAnnotationsUI = (annotations: AnnotationsControls) => ({
  ...annotations,
  ...useSignals({
    isActive: annotations.isActive,
    mode: annotations.mode,
    color: annotations.color,
    brushWeight: annotations.brushWeight,
    annotations: annotations.annotations,
  }),
});

export type AnnotationsUIControls = ReturnType<typeof useAnnotationsUI>;
