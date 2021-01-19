// config should be imported before importing any other file
import config from './configs/config';

import express from 'express';

import apiRoutes from './routes/api.routes';

const app = express();

// API router
app.use('/api/', apiRoutes);

app.listen(config.port, () => {
  console.info(`server started on port ${config.port} (${config.env})`);
});

