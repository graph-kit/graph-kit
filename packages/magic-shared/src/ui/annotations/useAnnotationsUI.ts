import { AnnotationsControls } from '@core/annotations/index';
import { useSignals } from '@graph/vue/utils/useSignal';

import { useComponent } from '../../component-slot/useComponent.ts';
import { ComponentSlotControls } from '../../component-slot/useComponentSlotsState.ts';
import AnnotationPanel from './AnnotationPanel.vue';

const ANNOTATION_PANEL_SLOT_ID = 'shell/annotations/panel';

export const useAnnotationsUI = (
  annotations: AnnotationsControls,
  componentSlots: ComponentSlotControls,
) => {
  const panel = useComponent(componentSlots, {
    component: AnnotationPanel,
    id: ANNOTATION_PANEL_SLOT_ID,
    position: 'center-left',
    priority: -Infinity,
  });

  annotations.events.subscribe('onActivated', panel.show);
  annotations.events.subscribe('onDeactivated', panel.hide);

  return {
    ui: {
      panel,
    },
    ...annotations,
    ...useSignals({
      isActive: annotations.isActive,
      mode: annotations.mode,
      color: annotations.color,
      brushWeight: annotations.brushWeight,
      annotations: annotations.annotations,
    }),
  };
};

export type AnnotationsUIControls = ReturnType<typeof useAnnotationsUI>;
