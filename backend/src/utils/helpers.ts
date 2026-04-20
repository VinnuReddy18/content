export const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const retryAsync = async <T>(
  fn: () => Promise<T>,
  retries: number = 3,
  delayMs: number = 1000
): Promise<T> => {
  for (let i = 0; i < retries; i++) {
    try {
      return await fn();
    } catch (error) {
      if (i === retries - 1) throw error;
      await sleep(delayMs);
    }
  }
  throw new Error("unreachable");
};
