'use strict';
Object.defineProperty(exports, '__esModule', { value: true });
const seed_1 = require('../src/utils/seed');
const ErrorEventModel_1 = require('../src/models/ErrorEventModel');
const loaders_1 = require('../src/loaders');
async function waitForEventsToProcess(expectedCount, maxAttempts = 5) {
  console.log('Waiting for events to be processed...');
  for (let attempt = 0; attempt < maxAttempts; attempt++) {
    const count = await ErrorEventModel_1.ErrorEventModel.countDocuments();
    console.log(`Current event count: ${count}/${expectedCount}`);
    if (count >= expectedCount) {
      console.log('All events processed successfully!');
      return;
    }
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }
  console.warn('Timeout waiting for events to be processed');
}
async function setup() {
  console.log('Starting database setup...\n');
  try {
    await (0, loaders_1.initializeLoaders)();
    const eventsSize = await (0, seed_1.seedEventData)();
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
    await (0, loaders_1.shutdownLoaders)();
    process.exit(0);
  }
}
setup();
//# sourceMappingURL=setup.js.map
