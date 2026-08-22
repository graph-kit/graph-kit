import { type ToastSeverity } from '@core/components/Toast/types';
import {
  mdiAlertCircle,
  mdiAlertOutline,
  mdiCheckCircle,
  mdiInformation,
} from '@mdi/js';

/**
 * exhaustive, so a severity added to the union is a compile error here rather than a
 * toast that quietly turns up without a mark
 */
export const severityIcon: Record<ToastSeverity, string> = {
  info: mdiInformation,
  success: mdiCheckCircle,
  warn: mdiAlertOutline,
  error: mdiAlertCircle,
};
