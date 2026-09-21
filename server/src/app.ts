import express, { type Express } from 'express';
import helmet from 'helmet';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import swaggerUi from 'swagger-ui-express';
import { config } from './config';
import { errorHandler, notFoundHandler } from './middlewares/errorHandler';
import type { RateLimitOptions } from './middlewares/rateLimit';
import { createApiRouter } from './routes';
import swaggerDocument from '../swagger.json';

export interface AppOptions {
  rateLimit?: RateLimitOptions;
}

export function createApp(options: AppOptions = {}): Express {
  const app = express();
  app.set('trust proxy', config.trustProxy);

  // Interactive docs need inline scripts, so they mount before Helmet's CSP and never in production.
  if (!config.isProd) {
    app.use('/api/docs', swaggerUi.serve, swaggerUi.setup(swaggerDocument as unknown as Record<string, unknown>));
  }

  app.use(helmet());
  // Exact-match origin only; nothing else is reflected. Vary: Origin is always set.
  app.use(
    cors({
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
      allowedHeaders: ['X-CSRF-Token', 'Content-Type'],
      origin: (origin, cb) => cb(null, origin === config.clientOrigin ? origin : false),
    }),
  );
  app.use((_req, res, next) => {
    res.vary('Origin');
    next();
  });
  app.use(express.json({ limit: '10kb' }));
  app.use(cookieParser());
  app.use('/api', createApiRouter(options.rateLimit));
  app.use(notFoundHandler);
  app.use(errorHandler);
  return app;
}

export const app = createApp();
