interface CacheEntry<T> {
  value: T;
  expiresAt: number;
}

export class Cache<T> {
  private store = new Map<string, CacheEntry<T>>();

  constructor(private ttlMs: number) {}

  get(key: string): T | undefined {
    const entry = this.store.get(key);
    if (!entry) return undefined;
    if (Date.now() > entry.expiresAt) {
      this.store.delete(key);
      return undefined;
    }
    return entry.value;
  }

  set(key: string, value: T): void {
    this.store.set(key, {
      value,
      expiresAt: Date.now() + this.ttlMs,
    });
  }

  mget(keys: string[]): (T | undefined)[] {
    return keys.map((k) => this.get(k));
  }

  mset(entries: [string, T][]): void {
    for (const [key, value] of entries) {
      this.set(key, value);
    }
  }

  size(): number {
    return this.store.size;
  }

  clear(): void {
    this.store.clear();
  }
}

export const previewUrlCache = new Cache<string | null>(
  30 * 24 * 60 * 60 * 1000,
);

export const funFactCache = new Cache<string>(
  7 * 24 * 60 * 60 * 1000,
);
