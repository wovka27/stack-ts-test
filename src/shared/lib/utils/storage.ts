export const storage = {
  set: <T>(key: string, value: T) =>
    localStorage.setItem(key, typeof value === 'string' ? value : JSON.stringify(value)),
  get: <T>(key: string): T | null => {
    const result = localStorage.getItem(key);

    try {
      return result ? (JSON.parse(result) as T) : null;
    } catch {
      return result as unknown as T;
    }
  },
  remove: (key: string) => localStorage.removeItem(key),
};
