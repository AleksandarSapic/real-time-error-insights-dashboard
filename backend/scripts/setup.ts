import { seedEventData } from '../src/utils/seed';
import { ErrorEventModel } from '../src/models/ErrorEventModel';
import { initializeLoaders, shutdownLoaders } from '../src/loaders';

async function setup() {
  console.log('Starting database setup...\n');

  try {
    await initializeLoaders();
    const eventsSize: number = await seedEventData();

    if (eventsSize === -1) {
      console.log('Events already exist, skipping processing wait');
    } else {
      await waitForEventsToProcess(eventsSize);
    }

    console.log('Setup completed successfully!');
  } catch (error) {
    console.error('Setup failed:', error);
    process.exit(1);
  } finally {
    await shutdownLoaders();
    process.exit(0);
  }
}

async function waitForEventsToProcess(
  expectedCount: number,
  maxAttempts = 5
): Promise<void> {
  console.log('Waiting for events to be processed...');

  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const count = await ErrorEventModel.countDocuments();
    console.log(`Current event count: ${count}/${expectedCount}`);

    if (count >= expectedCount) {
      console.log('All events processed successfully!');
      return;
    }

    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  console.warn('Timeout waiting for events to be processed');
}

setup();
