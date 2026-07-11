const PREFIX = "ticketox";

const makeKey = (key: string) => `${PREFIX}:${key}`;

export const storage = {
  get<T>(key: string, fallback: T): T {
    if (typeof window === "undefined") return fallback;

    try {
      const value = localStorage.getItem(makeKey(key));
      return value ? (JSON.parse(value) as T) : fallback;
    } catch {
      return fallback;
    }
  },

  set<T>(key: string, value: T): void {
    if (typeof window === "undefined") return;

    try {
      localStorage.setItem(makeKey(key), JSON.stringify(value));
    } catch {
      // Ignore quota/private browsing errors.
    }
  },

  remove(key: string): void {
    if (typeof window === "undefined") return;

    localStorage.removeItem(makeKey(key));
  },

  clear(): void {
    if (typeof window ==="undefined") return;

    Object.keys(localStorage)
      .filter((key) => key.startsWith(`${PREFIX}:`))
      .forEach((key) => localStorage.removeItem(key));
  },
};