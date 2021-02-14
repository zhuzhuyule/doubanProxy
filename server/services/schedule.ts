import schedule from 'node-schedule';
import { getLogger } from 'log4js';
import { updateDynamicMovies } from './spider';

const logger = getLogger();

const job = schedule.scheduleJob('0 0 3 * * *', () => {
  logger.info('Start schedule job');
  updateDynamicMovies('tag');
  updateDynamicMovies('type');
  updateDynamicMovies('newTag');
});

const schedules = [job];
export { schedules };
