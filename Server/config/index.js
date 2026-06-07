import mongodb from './database/mongodb.config.js';
import redis from './redis.config.js';

export const connectDatabases = async () => {
  await mongodb.connect();
  await redis.connect();
};

export const disconnectDatabases = async () => {
  await mongodb.disconnect();
  await redis.disconnect();
};

export { mongodb, redis };