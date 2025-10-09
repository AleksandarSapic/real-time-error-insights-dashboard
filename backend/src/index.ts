import config from './config';
import { createApp } from './api';
import { initializeLoaders } from './loaders';
import { seedEventData } from './utils/seed';

const app = createApp();
const port = config.app.port;
const hostname = config.app.hostname;

const startServer = async () => {
  try {
    await initializeLoaders();
    await seedEventData();

    app.listen(port, hostname, () => {
      console.log(`Server is running on http://${hostname}:${port}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
};

startServer();
