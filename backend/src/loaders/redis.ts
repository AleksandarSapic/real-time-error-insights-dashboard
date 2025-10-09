import Redis from 'ioredis';
import config from '../config';

let redisClient: Redis | null = null;

export const connectRedis = async (): Promise<Redis> => {
  try {
    redisClient = new Redis({
      host: config.redis.host,
      port: config.redis.port,
      username: config.redis.username,
      password: config.redis.password,
      db: config.redis.db,
      retryStrategy: (times) => {
        return Math.min(times * 50, 2000);
      },
    });

    redisClient.on('connect', () => {
      console.log('Redis connected successfully');
    });

    redisClient.on('error', (error) => {
      console.error('Redis connection error:', error);
    });

    await redisClient.ping();
    return redisClient;
  } catch (error) {
    console.error('Redis connection error:', error);
    throw error;
  }
};

export const getRedisClient = (): Redis => {
  if (!redisClient) {
    throw new Error('Redis not initialized. Call connectRedis first.');
  }
  return redisClient;
};

export const disconnectRedis = async (): Promise<void> => {
  if (redisClient) {
    await redisClient.quit();
    console.log('Redis disconnected');
  }
};
