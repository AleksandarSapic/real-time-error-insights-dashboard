import { Client } from '@elastic/elasticsearch';
import config from '../config';

let esClient: Client | null = null;

const buildElasticNode = (): string => {
  const { protocol, host, port } = config.elastic;
  return `${protocol}://${host}:${port}`;
};

export const connectElasticsearch = async (): Promise<Client> => {
  try {
    const node = buildElasticNode();
    const clientConfig: any = {
      node,
      auth: {
        username: config.elastic.username,
        password: config.elastic.password,
      },
    };

    // Only add TLS config if using HTTPS
    if (config.elastic.protocol === 'https') {
      clientConfig.tls = {
        rejectUnauthorized: false,
      };
    }

    esClient = new Client(clientConfig);

    await esClient.ping();
    console.log('Elasticsearch connected successfully');
    return esClient;
  } catch (error) {
    console.error('Elasticsearch connection error:', error);
    throw error;
  }
};

export const getElasticsearchClient = (): Client => {
  if (!esClient) {
    throw new Error(
      'Elasticsearch not initialized. Call connectElasticsearch first.'
    );
  }
  return esClient;
};

export const disconnectElasticsearch = async (): Promise<void> => {
  if (esClient) {
    await esClient.close();
    console.log('Elasticsearch disconnected');
  }
};
