import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { config } from './config';
import { apiRouter } from './routes';

export function createApp(): Express {
  const app = express();
  app.use(helmet());
  app.use(cors({ origin: config.clientOrigin, credentials: true }));
  app.use(express.json());
  app.use(cookieParser());
  app.use('/api', apiRouter);
  return app;
}

export const app = createApp();
