
// In-memory store for rate limiting.
// For production, consider a more persistent store like Redis.

const attempts = new Map<string, { count: number; lockUntil: number | null }>();
const MAX_ATTEMPTS = 3;
const LOCK_TIME_MS = 15 * 60 * 1000; // 15 minutes

export const rateLimiter = {
  /**
   * Checks if a key (e.g., email) is currently locked.
   * @param key The identifier for the user.
   * @returns An object with `allowed` (boolean) and `retryAfter` (in seconds, if locked).
   */
  check: (key: string): { allowed: boolean; retryAfter?: number } => {
    const record = attempts.get(key);
    if (!record || !record.lockUntil) {
      return { allowed: true };
    }

    const now = Date.now();
    if (now < record.lockUntil) {
      const retryAfter = Math.ceil((record.lockUntil - now) / 1000);
      return { allowed: false, retryAfter };
    }

    // Lock has expired, so we can clear it.
    attempts.delete(key);
    return { allowed: true };
  },

  /**
   * Records a failed attempt for a key. Locks the key if attempts exceed the limit.
   * @param key The identifier for the user.
   */
  consume: (key: string) => {
    const record = attempts.get(key) || { count: 0, lockUntil: null };
    record.count++;

    if (record.count >= MAX_ATTEMPTS) {
      record.lockUntil = Date.now() + LOCK_TIME_MS;
    }

    attempts.set(key, record);
  },

  /**
   * Resets the attempt counter for a key upon successful login.
   * @param key The identifier for the user.
   */
  reset: (key: string) => {
    if (attempts.has(key)) {
      attempts.delete(key);
    }
  },
};
