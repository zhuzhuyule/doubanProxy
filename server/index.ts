import { updateProgram } from '@utils/tool';

import apiRoutes from './routes/api.routes';
import config from './configs/config';
import express from 'express';
import '@configs/mongoose';
import '@services/schedule';

import { log4jsConfig } from '@configs/log4js';
import { configure, connectLogger, getLogger } from '@utils/logger';

const allowCrossDomain = function(_, res, next) {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET,PUT,POST,DELETE');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.header('Access-Control-Allow-Credentials','true');
  next();
};

try {
  configure(log4jsConfig.server);

  const logger = getLogger('express');

  const app = express();

  app.use(connectLogger(getLogger('api'), {}));

  app.use(allowCrossDomain);
  // API router
  app.use('/api', apiRoutes);

  app.listen(config.port, () => {
    logger.info(`server started on port ${config.port} (${config.env})`);
  });
} catch {
  updateProgram('_backup');
}
