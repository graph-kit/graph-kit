// @ts-expect-error add vite env to .d.ts
export const IS_DEV: boolean = import.meta.env.DEV;

/** the channel for warnings addressed to developers rather than users */
export const devWarning = (...data: unknown[]) => {
  if (!IS_DEV) return;
  console.warn(...data);
};

/** `assert` for expectations the caller can carry on from, so nothing is thrown */
export const devAssert = (condition: unknown, message: string) => {
  if (condition) return;
  devWarning(message);
};

export const useLogReport = <T = string>(
  frequencyMs = 1000,
  resetReportAfterLogging = true,
) => {
  const report = new Set<T>();
  const logReport = () => {
    console.log(Array.from(report));
    if (resetReportAfterLogging) report.clear();
  };
  setInterval(logReport, frequencyMs);
  return report;
};

export const useCooldownLog = (frequencyMs = 1000) => {
  let cooldown = false;
  const log = (...data: any[]) => {
    if (cooldown) return;
    console.log(...data);
    cooldown = true;
  };
  setInterval(() => (cooldown = false), frequencyMs);
  return log;
};
