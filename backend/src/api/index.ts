import express, { Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import morgan from 'morgan';
import eventsRouter from './routes/events';
import { errorHandler } from './middlewares/errorHandler';
import { notFound } from './middlewares/notFound';

export const createApp = (): Express => {
  const app = express();

  app.use(morgan('dev'));
  app.use(cors());
  app.use(helmet());
  app.use(express.json());

  app.use('/api/v1/events', eventsRouter);

  app.use(notFound);
  app.use(errorHandler);

  return app;
};
