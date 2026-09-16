const RUN_STARTED_AT = Date.now();

const toSecondString = (ms: number) => `${(ms / 1000).toFixed(1)}s`;

export const log = (message: string) => {
  const elapsed = toSecondString(Date.now() - RUN_STARTED_AT);
  // stderr because stdout carries the report itself when --out is not given
  process.stderr.write(`[${elapsed.padStart(6)}] ${message}\n`);
};

type WithTimeoutOptions<Result> = {
  task: Promise<Result>;
  timeoutMs: number;
  /** what went wrong, completed with how long it waited */
  failureMessage: string;
};

/** turns a hang into a failure that says which scenario and how long it waited */
export const withTimeout = async <Result>({
  task,
  timeoutMs,
  failureMessage,
}: WithTimeoutOptions<Result>) => {
  let timer: NodeJS.Timeout | undefined;

  const expiry = new Promise<never>((_, reject) => {
    timer = setTimeout(
      () =>
        reject(
          new Error(`${failureMessage} after ${toSecondString(timeoutMs)}.`),
        ),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([task, expiry]);
  } finally {
    clearTimeout(timer);
  }
};
