const RUN_STARTED_AT = Date.now();

/*
  stderr because stdout carries the report itself when --out is not given.

  every line is stamped with how far into the run it happened and names the
  stage it is entering rather than the one it finished, so a run that dies or
  hangs points at what it was doing instead of leaving the last completed step
  as the only clue
*/
export const log = (message: string) => {
  const elapsed = ((Date.now() - RUN_STARTED_AT) / 1000).toFixed(1);
  process.stderr.write(`[${elapsed.padStart(6)}s] ${message}\n`);
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
        reject(new Error(`${failureMessage} after ${timeoutMs / 1000}s.`)),
      timeoutMs,
    );
  });

  try {
    return await Promise.race([task, expiry]);
  } finally {
    clearTimeout(timer);
  }
};
