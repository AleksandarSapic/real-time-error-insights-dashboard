import dotenv from 'dotenv';

const envFound = dotenv.config();
if (envFound.error) {
  throw new Error("Couldn't find .env file");
}

export default {
  app: {
    hostname: process.env.BASE_URL || '',
    port: parseInt(process.env.PORT || '3000', 10),
    env: process.env.NODE_ENV || 'development',
  },

  mongo: {
    host: process.env.MONGO_HOST || 'localhost',
    port: parseInt(process.env.MONGO_PORT || '27017', 10),
    database: process.env.MONGO_DATABASE || 'error-insights',
    username: process.env.MONGO_USERNAME || '',
    password: process.env.MONGO_PASSWORD || '',
  },

  elastic: {
    host: process.env.ELASTIC_HOST || 'localhost',
    port: parseInt(process.env.ELASTIC_PORT || '9200', 10),
    protocol: process.env.ELASTIC_PROTOCOL || 'http',
    username: process.env.ELASTIC_USERNAME || 'elastic',
    password: process.env.ELASTIC_PASSWORD || '',
    index: process.env.ELASTIC_INDEX || 'error-events',
  },

  redis: {
    username: process.env.REDIS_USERNAME || '',
    password: process.env.REDIS_PASSWORD || '',
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379', 10),
    db: parseInt(process.env.REDIS_DB || '0', 10),
  },

  cache: {
    searchTTL: parseInt(process.env.CACHE_SEARCH_TTL || '300', 10),
    statsTTL: parseInt(process.env.CACHE_STATS_TTL || '600', 10),
  },

  kafka: {
    clientId: process.env.KAFKA_CLIENT_ID || 'error-tracking-service',
    brokers: (process.env.KAFKA_BROKERS || 'localhost:9092').split(','),
    topics: {
      events: process.env.KAFKA_EVENTS_TOPIC || 'error-events',
    },
    consumerGroupId:
      process.env.KAFKA_CONSUMER_GROUP || 'error-events-processor',
  },
};
