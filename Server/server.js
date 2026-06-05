import app from './app.js';
import logger from './config/logger/winston.config.js';

const PORT = process.env.PORT || 5000;
const server = app.listen(PORT, () => {
  logger.info(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
  logger.info(`API URL: http://localhost:${PORT}/api/v1`);
  logger.info(`Health check: http://localhost:${PORT}/health`);
});

export default server;