import { readFileSync } from 'fs';
import { join } from 'path';
import { z } from 'zod';
import { ErrorEvent } from '../models/ErrorEvent';
import { ErrorEventModel } from '../models/ErrorEventModel';
import config from '../config';
import { getKafkaProducer } from '../loaders/kafka';

const errorEventSchema = z.object({
  timestamp: z.iso.datetime().nonempty(),
  userId: z.string().nonempty(),
  browser: z.string().nonempty(),
  url: z.string().nonempty(),
  errorMessage: z.string().nonempty(),
  stackTrace: z.string().nonempty(),
});

const errorEventsArraySchema = z.array(errorEventSchema);

export const seedEventData = async (): Promise<number> => {
  console.log('Starting data seeding process...');

  try {
    const filePath = join(__dirname, '../../data/events.json');
    const fileContent = readFileSync(filePath, 'utf-8');
    const parsedData = JSON.parse(fileContent);
    const events: ErrorEvent[] = errorEventsArraySchema.parse(
      parsedData
    ) as ErrorEvent[];

    console.log(`Loaded ${events.length} events from file`);

    const existingCount = await ErrorEventModel.countDocuments();
    if (existingCount > 0) {
      console.log(
        `MongoDB already has ${existingCount} documents. Skipping seed.`
      );
      return -1;
    }

    console.log('Publishing events to Kafka...');
    const producer = getKafkaProducer();

    const messages = events.map((event) => ({
      key: crypto.randomUUID(),
      value: JSON.stringify(event),
      headers: {
        'event-type': 'error',
        source: 'file-loader',
      },
    }));

    await producer.send({
      topic: config.kafka.topics.events,
      messages,
    });

    console.log(
      `Published ${events.length} events to Kafka topic: ${config.kafka.topics.events}`
    );
    console.log(
      'Data seeding completed successfully. Events will be processed by Kafka consumer.'
    );
    return events.length;
  } catch (error) {
    console.error('Error during data seeding:', error);
    throw error;
  }
};
