// Limit active Jira workflows per server process. Waiting requests have not yet
// contacted Jira, so time in this queue does not consume a provider timeout.
export function submissionQueue(concurrency: number, maxWaiting: number) {
  let active = 0;
  const waiting: Array<() => void> = [];
  return async function run<T>(work: () => Promise<T>): Promise<T | undefined> {
    if (active < concurrency) active++;
    else {
      if (waiting.length >= maxWaiting) return undefined;
      await new Promise<void>((resolve) => waiting.push(resolve));
    }
    try {
      return await work();
    } finally {
      const next = waiting.shift();
      if (next) next();
      else active--;
    }
  };
}
export const runSubmission = submissionQueue(8, 0);
