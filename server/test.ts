import '@configs/mongoose';
import { log4jsConfig } from '@configs/log4js';
import { configure, getLogger } from '@utils/logger';
import { LOG_CONTEXT_KEYS } from '@utils/constants';
import { updateAll, updateDynamicMovies } from '@services/spider';
import proxy from '@services/proxy';
import { mergeMovie } from '@services/update';


configure(log4jsConfig.test);

setTimeout(async () => {
  // await proxy.getAll();
  // proxy.get
  await updateDynamicMovies();
  // await updateAll();
}, 5000);

