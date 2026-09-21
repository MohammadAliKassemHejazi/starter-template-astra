import { app } from './app';
import { config } from './config';
import { sequelize } from './db/sequelize';
import { purgeExpiredTokens } from './services/token.service';
import { logger } from './utils/logger';

async function main(): Promise<void> {
  await sequelize.authenticate();
  const purge = (): Promise<void> =>
    purgeExpiredTokens().catch((err: unknown): void => void logger.warn('token_purge_failed', { message: err instanceof Error ? err.message : 'unknown' }));
  await purge();
  setInterval(() => void purge(), 6 * 3_600_000).unref();

  const server = app.listen(config.port, () => logger.info(`server listening on ${config.port}`));
  const shutdown = (): void => {
    server.close(() => void sequelize.close().finally(() => process.exit(0)));
  };
  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

main().catch((err: unknown) => {
  logger.error('startup_failed', { message: err instanceof Error ? err.message : 'unknown' });
  process.exit(1);
});
