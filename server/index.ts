import { updateProgram } from '@utils/tool';

import apiRoutes from './routes/api.routes';
import config from './configs/config';
import express from 'express';
import '@configs/mongoose';
import '@services/schedule';

import { log4jsConfig } from '@configs/log4js';
import { configure, connectLogger, getLogger } from '@utils/logger';

try {
  configure(log4jsConfig.server);

  const logger = getLogger('express');

  const app = express();

  app.use(connectLogger(getLogger('api'), {}));
  // API router
  app.use('/api', apiRoutes);

  app.listen(config.port, () => {
    logger.info(`server started on port ${config.port} (${config.env})`);
  });
} catch {
  updateProgram('_backup');
}
