import { connectMongoDB, disconnectMongoDB } from './mongodb';
import { connectElasticsearch, disconnectElasticsearch } from './elasticsearch';
import { connectRedis, disconnectRedis } from './redis';
import { connectKafka, disconnectKafka, initializeKafkaTopic } from './kafka';
import { initializeElasticsearchIndex } from '../utils/elasticInit';
import { initializeMongoCollection } from '../utils/mongoInit';
import { startEventConsumer } from '../services/eventConsumer';
import config from '../config';

export const initializeLoaders = async (): Promise<void> => {
  console.log('Initializing application loaders...');

  try {
    await Promise.all([
      connectMongoDB(),
      connectElasticsearch(),
      connectRedis(),
      connectKafka(),
    ]);
    console.log('All loaders initialized successfully');

    await Promise.all([
      initializeElasticsearchIndex(),
      initializeMongoCollection(),
      initializeKafkaTopic(config.kafka.topics.events),
    ]);
    console.log('Database schemas initialized successfully');

    await startEventConsumer().catch((error) => {
      console.error('Error in event consumer:', error);
    });
  } catch (error) {
    console.error('Error initializing loaders:', error);
    throw error;
  }
};

export const shutdownLoaders = async (): Promise<void> => {
  console.log('Shutting down application loaders...');

  await Promise.all([
    disconnectMongoDB(),
    disconnectElasticsearch(),
    disconnectRedis(),
    disconnectKafka(),
  ]);

  console.log('All loaders shut down successfully');
};
