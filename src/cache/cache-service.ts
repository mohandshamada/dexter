import { existsSync, mkdirSync, readFileSync, writeFileSync, readdirSync, statSync, unlinkSync } from 'fs';
import { join } from 'path';
import { createHash } from 'crypto';

export interface CacheOptions {
  ttl?: number; // Time to live in milliseconds (default: 24 hours)
  directory?: string; // Cache directory (default: .dexter/cache)
}

export interface CacheEntry<T> {
  data: T;
  timestamp: number;
  key: string;
}

/**
 * Filesystem-based cache service for API responses
 */
export class CacheService {
  private readonly cacheDir: string;
  private readonly ttl: number;

  constructor(options: CacheOptions = {}) {
    this.cacheDir = join(process.cwd(), options.directory || '.dexter/cache');
    this.ttl = options.ttl || 24 * 60 * 60 * 1000; // Default: 24 hours

    // Ensure cache directory exists
    if (!existsSync(this.cacheDir)) {
      mkdirSync(this.cacheDir, { recursive: true });
    }
  }

  /**
   * Generate a cache key from parameters
   */
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .map(key => `${key}=${JSON.stringify(params[key])}`)
      .join('&');

    const hash = createHash('md5').update(sortedParams).digest('hex');
    return `${prefix}_${hash}`;
  }

  /**
   * Get the file path for a cache key
   */
  private getFilePath(key: string): string {
    return join(this.cacheDir, `${key}.json`);
  }

  /**
   * Check if a cache entry is still valid
   */
  private isValid(timestamp: number): boolean {
    return Date.now() - timestamp < this.ttl;
  }

  /**
   * Get cached data if available and valid
   */
  get<T = any>(prefix: string, params: Record<string, any>): T | null {
    const key = this.generateKey(prefix, params);
    const filePath = this.getFilePath(key);

    if (!existsSync(filePath)) {
      return null;
    }

    try {
      const content = readFileSync(filePath, 'utf-8');
      const entry: CacheEntry<T> = JSON.parse(content);

      if (!this.isValid(entry.timestamp)) {
        // Cache expired, delete the file
        unlinkSync(filePath);
        return null;
      }

      return entry.data;
    } catch (error) {
      // If there's an error reading or parsing, delete the file
      try {
        unlinkSync(filePath);
      } catch {
        // Ignore deletion errors
      }
      return null;
    }
  }

  /**
   * Set cached data
   */
  set<T = any>(prefix: string, params: Record<string, any>, data: T): void {
    const key = this.generateKey(prefix, params);
    const filePath = this.getFilePath(key);

    const entry: CacheEntry<T> = {
      data,
      timestamp: Date.now(),
      key,
    };

    try {
      writeFileSync(filePath, JSON.stringify(entry), 'utf-8');
    } catch (error) {
      // Silently ignore cache write errors
    }
  }

  /**
   * Clear all expired cache entries
   */
  clearExpired(): number {
    let cleared = 0;

    try {
      const files = readdirSync(this.cacheDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = join(this.cacheDir, file);

        try {
          const content = readFileSync(filePath, 'utf-8');
          const entry: CacheEntry<any> = JSON.parse(content);

          if (!this.isValid(entry.timestamp)) {
            unlinkSync(filePath);
            cleared++;
          }
        } catch {
          // If we can't read/parse the file, delete it
          try {
            unlinkSync(filePath);
            cleared++;
          } catch {
            // Ignore deletion errors
          }
        }
      }
    } catch (error) {
      // Silently ignore errors
    }

    return cleared;
  }

  /**
   * Clear all cache entries
   */
  clearAll(): number {
    let cleared = 0;

    try {
      const files = readdirSync(this.cacheDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        try {
          unlinkSync(join(this.cacheDir, file));
          cleared++;
        } catch {
          // Ignore deletion errors
        }
      }
    } catch (error) {
      // Silently ignore errors
    }

    return cleared;
  }

  /**
   * Get cache statistics
   */
  getStats(): { total: number; valid: number; expired: number; size: number } {
    let total = 0;
    let valid = 0;
    let expired = 0;
    let size = 0;

    try {
      const files = readdirSync(this.cacheDir);

      for (const file of files) {
        if (!file.endsWith('.json')) continue;

        const filePath = join(this.cacheDir, file);
        total++;

        try {
          const stat = statSync(filePath);
          size += stat.size;

          const content = readFileSync(filePath, 'utf-8');
          const entry: CacheEntry<any> = JSON.parse(content);

          if (this.isValid(entry.timestamp)) {
            valid++;
          } else {
            expired++;
          }
        } catch {
          expired++;
        }
      }
    } catch (error) {
      // Silently ignore errors
    }

    return { total, valid, expired, size };
  }
}

// Singleton instance
let cacheInstance: CacheService | null = null;

export function getCache(options?: CacheOptions): CacheService {
  if (!cacheInstance) {
    cacheInstance = new CacheService(options);
  }
  return cacheInstance;
}
