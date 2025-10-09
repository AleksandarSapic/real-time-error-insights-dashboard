import { getRedisClient } from '../loaders/redis';
import crypto from 'crypto';
import { CacheOptions } from '../types/cache';

const generateCacheKey = (
  prefix: string,
  params: Record<string, any>
): string => {
  const sortedParams = Object.keys(params)
    .sort()
    .reduce(
      (acc, key) => {
        acc[key] = params[key];
        return acc;
      },
      {} as Record<string, any>
    );

  const paramsString = JSON.stringify(sortedParams);
  const hash = crypto.createHash('md5').update(paramsString).digest('hex');

  return `${prefix}:${hash}`;
};

export const withCache = async <T>(
  options: CacheOptions,
  fetchFn: () => Promise<T>
): Promise<T> => {
  const { prefix, ttl, params } = options;
  const cacheKey = generateCacheKey(prefix, params);
  const redis = getRedisClient();

  try {
    const cached = await redis.get(cacheKey);

    if (cached) {
      console.log(`Cache hit for key: ${cacheKey}`);
      return JSON.parse(cached) as T;
    }

    console.log(`Cache miss for key: ${cacheKey}`);
  } catch (error) {
    console.error('Cache read error:', error);
    // Continue to fetch if cache read fails
  }

  const result = await fetchFn();

  try {
    await redis.setex(cacheKey, ttl, JSON.stringify(result));
    console.log(`Cached result with key: ${cacheKey}, TTL: ${ttl}s`);
  } catch (error) {
    console.error('Cache write error:', error);
    // Don't fail the request if cache write fails
  }

  return result;
};

export const deleteCache = async (
  prefix: string,
  params: Record<string, any>
): Promise<void> => {
  const redis = getRedisClient();
  const cacheKey = generateCacheKey(prefix, params);

  try {
    await redis.del(cacheKey);
    console.log(`Cache deleted for key: ${cacheKey}`);
  } catch (error) {
    console.error('Cache delete error:', error);
  }
};

export const invalidateCacheByPrefix = async (
  prefix: string
): Promise<void> => {
  const redis = getRedisClient();

  try {
    const pattern = `${prefix}:*`;
    const keys = await redis.keys(pattern);

    if (keys.length > 0) {
      await redis.del(...keys);
      console.log(
        `Invalidated ${keys.length} cache keys with prefix: ${prefix}`
      );
    } else {
      console.log(`No cache keys found with prefix: ${prefix}`);
    }
  } catch (error) {
    console.error('Cache invalidation error:', error);
  }
};

export const clearAllCache = async (): Promise<void> => {
  const redis = getRedisClient();

  try {
    await redis.flushdb();
    console.log('All cache cleared');
  } catch (error) {
    console.error('Cache clear error:', error);
  }
};
