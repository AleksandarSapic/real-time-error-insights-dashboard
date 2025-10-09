import { Admin, Consumer, Kafka, Producer } from 'kafkajs';
import config from '../config';

let kafka: Kafka | null = null;
let producer: Producer | null = null;
let consumer: Consumer | null = null;
let admin: Admin | null = null;

export const connectKafka = async (): Promise<{
  producer: Producer;
  consumer: Consumer;
}> => {
  try {
    kafka = new Kafka({
      clientId: config.kafka.clientId,
      brokers: config.kafka.brokers,
      retry: {
        initialRetryTime: 100,
        retries: 8,
      },
      connectionTimeout: 10000,
      requestTimeout: 30000,
    });

    producer = kafka.producer();
    consumer = kafka.consumer({ groupId: config.kafka.consumerGroupId });

    await producer.connect();
    console.log('Kafka Producer connected successfully');

    await consumer.connect();
    console.log('Kafka Consumer connected successfully');

    return { producer, consumer };
  } catch (error) {
    console.error('Kafka connection error:', error);
    throw error;
  }
};

export const getKafkaProducer = (): Producer => {
  if (!producer) {
    throw new Error('Kafka Producer not initialized. Call connectKafka first.');
  }
  return producer;
};

export const getKafkaConsumer = (): Consumer => {
  if (!consumer) {
    throw new Error('Kafka Consumer not initialized. Call connectKafka first.');
  }
  return consumer;
};

export const initializeKafkaTopic = async (
  topic: string,
  numPartitions = 1,
  replicationFactor = 1
): Promise<void> => {
  if (!kafka) {
    throw new Error('Kafka not initialized. Call connectKafka first.');
  }

  try {
    if (!admin) {
      admin = kafka.admin();
      await admin.connect();
      console.log('Kafka Admin connected successfully');
    }

    const existingTopics = await admin.listTopics();

    if (existingTopics.includes(topic)) {
      console.log(`Topic "${topic}" already exists`);
      return;
    }

    await admin.createTopics({
      topics: [
        {
          topic,
          numPartitions,
          replicationFactor,
        },
      ],
    });

    console.log(`Topic "${topic}" created successfully`);
  } catch (error) {
    console.error(`Error creating topic "${topic}":`, error);
    throw error;
  }
};

export const disconnectKafka = async (): Promise<void> => {
  if (producer) {
    await producer.disconnect();
    console.log('Kafka Producer disconnected');
  }
  if (consumer) {
    await consumer.disconnect();
    console.log('Kafka Consumer disconnected');
  }
  if (admin) {
    await admin.disconnect();
    console.log('Kafka Admin disconnected');
  }
};
