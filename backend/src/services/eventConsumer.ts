import { getKafkaConsumer } from '../loaders/kafka';
import { getElasticsearchClient } from '../loaders/elasticsearch';
import { ErrorEvent } from '../models/ErrorEvent';
import { ErrorEventModel } from '../models/ErrorEventModel';
import config from '../config';
import { invalidateCacheByPrefix } from '../utils/cache';

export const startEventConsumer = async (): Promise<void> => {
  console.log('Starting Kafka event consumer...');

  try {
    const consumer = getKafkaConsumer();
    const esClient = getElasticsearchClient();

    await consumer.subscribe({
      topic: config.kafka.topics.events,
      fromBeginning: true,
    });

    console.log(`Subscribed to topic: ${config.kafka.topics.events}`);

    consumer
      .run({
        eachBatch: async ({ batch, resolveOffset, heartbeat }) => {
          console.log(
            `Processing batch of ${batch.messages.length} messages from partition ${batch.partition}`
          );

          const events: ErrorEvent[] = batch.messages.flatMap((message) => {
            if (!message.value) return [];

            try {
              const event: ErrorEvent = JSON.parse(message.value.toString());
              return [event];
            } catch (error) {
              console.error('Failed to parse message:', error);
              return [];
            }
          });

          if (events.length === 0) {
            console.log('No valid events to process');
            return;
          }

          try {
            console.log(`Inserting ${events.length} events into MongoDB...`);
            const mongoResult = await ErrorEventModel.insertMany(events, {
              ordered: false,
            });
            console.log(`Inserted ${mongoResult.length} events into MongoDB`);

            console.log(
              `Inserting ${events.length} events into Elasticsearch...`
            );
            const bulkOperations = events.flatMap((event) => [
              { index: { _index: config.elastic.index } },
              event,
            ]);

            const esResult = await esClient.bulk({
              body: bulkOperations,
              refresh: true,
            });

            if (esResult.errors) {
              console.error('Some Elasticsearch bulk operations failed');
              const failedItems = esResult.items.filter(
                (item) => item.index?.error
              );
              console.error(`Failed items: ${failedItems.length}`);
            } else {
              console.log(
                `Inserted ${events.length} events into Elasticsearch`
              );
            }

            console.log('Invalidating cache...');
            await Promise.all([
              invalidateCacheByPrefix('search'),
              invalidateCacheByPrefix('stats'),
            ]);
            console.log('Cache invalidated');

            const lastMessage = batch.messages[batch.messages.length - 1];
            if (lastMessage) {
              resolveOffset(lastMessage?.offset);
            }
            await heartbeat();

            console.log(
              `Successfully processed batch of ${events.length} events`
            );
          } catch (error) {
            console.error('Error processing batch:', error);
            // Here should be implemented Dead Letter Queue (DLQ) logic
            throw error;
          }
        },
      })
      .catch((error) => {
        console.error('Fatal error in consumer run loop:', error);
        process.exit(1);
      });

    console.log('Kafka consumer is now running in the background');
  } catch (error) {
    console.error('Error in event consumer:', error);
    throw error;
  }
};
