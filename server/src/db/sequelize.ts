import { Sequelize } from 'sequelize';
import { config } from '../config';

// Query logging is off on purpose: bound parameters can contain credentials/tokens.
export const sequelize = new Sequelize(config.databaseUrl, {
  dialect: 'postgres',
  logging: false,
  pool: { max: 10, min: 0, idle: 10_000 },
});
