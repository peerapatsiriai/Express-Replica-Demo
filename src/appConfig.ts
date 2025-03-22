import * as dotenv from 'dotenv';
import { join } from 'path';

dotenv.config();

const appConfig = {
  databaseUrl: process.env.DATABASE_URL,
  replica1Url: process.env.REPLICA_1_URL,
  replica2Url: process.env.REPLICA_2_URL,
  rabbitMqUrl: process.env.RABBITMQ_URL,
  port: process.env.PORT || 3000,
};

export default appConfig;