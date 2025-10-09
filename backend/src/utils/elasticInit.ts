import { getElasticsearchClient } from '../loaders/elasticsearch';
import config from '../config';

export const initializeElasticsearchIndex = async (): Promise<void> => {
  const client = getElasticsearchClient();
  const indexName = config.elastic.index;

  try {
    const exists = await client.indices.exists({ index: indexName });

    if (exists) {
      console.log(`Elasticsearch index "${indexName}" already exists`);
      return;
    }

    await client.indices.create({
      index: indexName,
      settings: {
        number_of_shards: 1,
        number_of_replicas: 1,
      },
      mappings: {
        properties: {
          timestamp: {
            type: 'date',
          },
          userId: {
            type: 'keyword',
          },
          browser: {
            type: 'keyword',
          },
          url: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          errorMessage: {
            type: 'text',
            fields: {
              keyword: {
                type: 'keyword',
                ignore_above: 256,
              },
            },
          },
          stackTrace: {
            type: 'text',
          },
        },
      },
    });

    console.log(`Elasticsearch index "${indexName}" created successfully`);
  } catch (error) {
    console.error('Error initializing Elasticsearch index:', error);
    throw error;
  }
};
