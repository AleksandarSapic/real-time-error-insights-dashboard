import {
  withCache,
  deleteCache,
  invalidateCacheByPrefix,
  clearAllCache,
} from '../src/utils/cache';
import { getRedisClient } from '../src/loaders/redis';

jest.mock('../src/loaders/redis');

describe('Redis Caching', () => {
  let mockRedis: any;

  beforeEach(() => {
    mockRedis = {
      get: jest.fn(),
      setex: jest.fn(),
      del: jest.fn(),
      keys: jest.fn(),
      flushdb: jest.fn(),
    };
    (getRedisClient as jest.Mock).mockReturnValue(mockRedis);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('withCache', () => {
    it('should return cached data on cache hit', async () => {
      const cachedData = { result: 'cached value' };
      mockRedis.get.mockResolvedValue(JSON.stringify(cachedData));

      const fetchFn = jest.fn();
      const result = await withCache(
        { prefix: 'test', ttl: 300, params: { id: '123' } },
        fetchFn
      );

      expect(result).toEqual(cachedData);
      expect(mockRedis.get).toHaveBeenCalledTimes(1);
      expect(fetchFn).not.toHaveBeenCalled();
      expect(mockRedis.setex).not.toHaveBeenCalled();
    });

    it('should fetch and cache data on cache miss', async () => {
      const freshData = { result: 'fresh value' };
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockResolvedValue('OK');

      const fetchFn = jest.fn().mockResolvedValue(freshData);
      const result = await withCache(
        { prefix: 'test', ttl: 600, params: { id: '456' } },
        fetchFn
      );

      expect(result).toEqual(freshData);
      expect(mockRedis.get).toHaveBeenCalledTimes(1);
      expect(fetchFn).toHaveBeenCalledTimes(1);
      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.stringContaining('test:'),
        600,
        JSON.stringify(freshData)
      );
    });

    it('should generate consistent cache keys for same parameters', async () => {
      mockRedis.get.mockResolvedValue(null);
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' });

      await withCache(
        { prefix: 'search', ttl: 300, params: { a: '1', b: '2' } },
        fetchFn
      );
      const firstKey = mockRedis.get.mock.calls[0][0];

      jest.clearAllMocks();
      mockRedis.get.mockResolvedValue(null);

      await withCache(
        { prefix: 'search', ttl: 300, params: { b: '2', a: '1' } },
        fetchFn
      );
      const secondKey = mockRedis.get.mock.calls[0][0];

      expect(firstKey).toBe(secondKey);
    });

    it('should generate different cache keys for different parameters', async () => {
      mockRedis.get.mockResolvedValue(null);
      const fetchFn = jest.fn().mockResolvedValue({ data: 'test' });

      await withCache(
        { prefix: 'search', ttl: 300, params: { id: '1' } },
        fetchFn
      );
      const firstKey = mockRedis.get.mock.calls[0][0];

      jest.clearAllMocks();
      mockRedis.get.mockResolvedValue(null);

      await withCache(
        { prefix: 'search', ttl: 300, params: { id: '2' } },
        fetchFn
      );
      const secondKey = mockRedis.get.mock.calls[0][0];

      expect(firstKey).not.toBe(secondKey);
    });

    it('should continue with fetch when cache read fails', async () => {
      const freshData = { result: 'fresh value' };
      mockRedis.get.mockRejectedValue(new Error('Redis connection error'));
      const fetchFn = jest.fn().mockResolvedValue(freshData);

      const result = await withCache(
        { prefix: 'test', ttl: 300, params: { id: '123' } },
        fetchFn
      );

      expect(result).toEqual(freshData);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('should not fail request when cache write fails', async () => {
      const freshData = { result: 'fresh value' };
      mockRedis.get.mockResolvedValue(null);
      mockRedis.setex.mockRejectedValue(new Error('Cache write error'));
      const fetchFn = jest.fn().mockResolvedValue(freshData);

      const result = await withCache(
        { prefix: 'test', ttl: 300, params: { id: '123' } },
        fetchFn
      );

      expect(result).toEqual(freshData);
      expect(fetchFn).toHaveBeenCalledTimes(1);
    });

    it('should use correct TTL when caching', async () => {
      const freshData = { result: 'value' };
      mockRedis.get.mockResolvedValue(null);
      const fetchFn = jest.fn().mockResolvedValue(freshData);

      await withCache(
        { prefix: 'test', ttl: 900, params: { id: '123' } },
        fetchFn
      );

      expect(mockRedis.setex).toHaveBeenCalledWith(
        expect.any(String),
        900,
        expect.any(String)
      );
    });
  });

  describe('deleteCache', () => {
    it('should delete cache entry for given prefix and params', async () => {
      mockRedis.del.mockResolvedValue(1);

      await deleteCache('search', { query: 'test', page: 1 });

      expect(mockRedis.del).toHaveBeenCalledWith(
        expect.stringContaining('search:')
      );
    });

    it('should handle deletion errors gracefully', async () => {
      mockRedis.del.mockRejectedValue(new Error('Delete failed'));

      await expect(
        deleteCache('search', { query: 'test' })
      ).resolves.toBeUndefined();
    });
  });

  describe('invalidateCacheByPrefix', () => {
    it('should delete all keys matching prefix', async () => {
      const keys = ['search:key1', 'search:key2', 'search:key3'];
      mockRedis.keys.mockResolvedValue(keys);
      mockRedis.del.mockResolvedValue(3);

      await invalidateCacheByPrefix('search');

      expect(mockRedis.keys).toHaveBeenCalledWith('search:*');
      expect(mockRedis.del).toHaveBeenCalledWith(...keys);
    });

    it('should not call del when no keys found', async () => {
      mockRedis.keys.mockResolvedValue([]);

      await invalidateCacheByPrefix('search');

      expect(mockRedis.keys).toHaveBeenCalledWith('search:*');
      expect(mockRedis.del).not.toHaveBeenCalled();
    });

    it('should handle invalidation errors gracefully', async () => {
      mockRedis.keys.mockRejectedValue(new Error('Redis error'));

      await expect(invalidateCacheByPrefix('search')).resolves.toBeUndefined();
    });

    it('should invalidate different prefixes independently', async () => {
      mockRedis.keys.mockResolvedValue(['stats:key1', 'stats:key2']);
      mockRedis.del.mockResolvedValue(2);

      await invalidateCacheByPrefix('stats');

      expect(mockRedis.keys).toHaveBeenCalledWith('stats:*');
    });
  });

  describe('clearAllCache', () => {
    it('should flush entire database', async () => {
      mockRedis.flushdb.mockResolvedValue('OK');

      await clearAllCache();

      expect(mockRedis.flushdb).toHaveBeenCalledTimes(1);
    });

    it('should handle flush errors gracefully', async () => {
      mockRedis.flushdb.mockRejectedValue(new Error('Flush failed'));

      await expect(clearAllCache()).resolves.toBeUndefined();
    });
  });

  describe('Cache Key Generation', () => {
    it('should generate cache keys with prefix', async () => {
      mockRedis.get.mockResolvedValue(null);
      const fetchFn = jest.fn().mockResolvedValue({});

      await withCache({ prefix: 'myprefix', ttl: 300, params: {} }, fetchFn);

      const cacheKey = mockRedis.get.mock.calls[0][0];
      expect(cacheKey).toMatch(/^myprefix:/);
    });

    it('should include hash of params in cache key', async () => {
      mockRedis.get.mockResolvedValue(null);
      const fetchFn = jest.fn().mockResolvedValue({});

      await withCache(
        { prefix: 'test', ttl: 300, params: { userId: 'user1', page: 5 } },
        fetchFn
      );

      const cacheKey = mockRedis.get.mock.calls[0][0];
      expect(cacheKey).toMatch(/^test:[a-f0-9]{32}$/);
    });
  });
});
