import { type ToastSeverity } from './types.ts';

/**
 * the accent each severity wears, kept to the leading edge so the surface underneath
 * stays whatever a wrapper decided it should be
 */
export const toastAccents: Record<ToastSeverity, string> = {
  info: 'border-l-4 border-l-blue-500',
  success: 'border-l-4 border-l-emerald-500',
  warn: 'border-l-4 border-l-amber-500',
  error: 'border-l-4 border-l-red-500',
  magic:
    'border-l-4 border-l-transparent bg-linear-to-tr from-purple-600 to-orange-600 bg-origin-border bg-left bg-no-repeat bg-[length:4px_100%]',
};

/** what the icon slot is tinted, so the icon and the accent read as one mark */
export const toastIconColors: Record<ToastSeverity, string> = {
  info: 'text-blue-500',
  success: 'text-emerald-500',
  warn: 'text-amber-500',
  error: 'text-red-500',
  magic: 'text-orange-500',
};
