import { onMounted, watch } from 'vue';

import { dialog } from '../../ui/dialog/useShellDialog.ts';
import { UserAgentControls } from '../../user-agent/useUserAgent.ts';

/** shows a warning dialog if the user's device is touch only */
export const useTouchScreenWarning = (userAgent: UserAgentControls) => {
  const warn = () => {
    if (!userAgent.isTouchOnly.value) return;

    dialog.open({
      title: 'We Could Not Find A Mouse',
      description:
        'Magic Graphs does not support touch devices yet. Come back with a mouse or trackpad, we will still be here, pinky promise.',
      actions: [{ textContent: 'Got It', onClick: () => {} }],
    });
  };

  watch(userAgent.isTouchOnly, warn);
  // the media query only reads true once there is a browser under it, which is after setup
  onMounted(warn);
};
