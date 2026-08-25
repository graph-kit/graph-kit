import { readLocalStorage, writeLocalStorage } from '@core/utils/localStorage';
import {
  mdiRabbit,
  mdiSpeedometer,
  mdiSpeedometerMedium,
  mdiSpeedometerSlow,
  mdiTurtle,
} from '@mdi/js';

export type AnimationSpeed = 'Slowest' | 'Slow' | 'Normal' | 'Fast' | 'Fastest';

/** how long one auto animated capture takes to play out at each speed */
export const ANIMATION_SPEED_DURATION_MS: Record<AnimationSpeed, number> = {
  Slowest: 3000,
  Slow: 1000,
  Normal: 500,
  Fast: 300,
  Fastest: 100,
};

export const ANIMATION_SPEED_ICON: Record<AnimationSpeed, string> = {
  Slowest: mdiTurtle,
  Slow: mdiSpeedometerSlow,
  Normal: mdiSpeedometerMedium,
  Fast: mdiSpeedometer,
  Fastest: mdiRabbit,
};

export const ANIMATION_SPEEDS = Object.keys(
  ANIMATION_SPEED_DURATION_MS,
) as AnimationSpeed[];

/** a duration as a reader would say it, e.g. "0.5 Seconds" */
export const durationMsToString = (durationMs: number) => {
  const seconds = durationMs / 1000;
  return `${seconds} ${seconds === 1 ? 'Second' : 'Seconds'}`;
};

const ANIMATION_SPEED_LOCAL_KEY = 'animation-speed';

const isAnimationSpeed = (value: string): value is AnimationSpeed =>
  Object.hasOwn(ANIMATION_SPEED_DURATION_MS, value);

/** the speed this browser last chose, or undefined if it never did */
export const readAnimationSpeed = () => {
  const stored = readLocalStorage(ANIMATION_SPEED_LOCAL_KEY);
  if (!stored || !isAnimationSpeed(stored)) return;
  return stored;
};

export const writeAnimationSpeed = (speed: AnimationSpeed) =>
  writeLocalStorage(ANIMATION_SPEED_LOCAL_KEY, speed);
