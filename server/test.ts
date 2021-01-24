import config from './configs/config';
import '@configs/mongoose';
import mongoose from 'mongoose';

import { updateAll, updateDynamicMovies } from '@services/spider';
import proxy from '@services/proxy';

setTimeout(async () => {
  // await proxy.getAll();
  // proxy.get
  await updateDynamicMovies('tag');
  // await updateAll();
}, 5000);