import schedule from 'node-schedule';
import { getLogger } from 'log4js';
import { updateDynamicMovies } from './spider';

const logger = getLogger('schedule');

const tagJob = schedule.scheduleJob('Update tag movies','0 0 2 * * *', () => {
  logger.info(tagJob.name);
  updateDynamicMovies('tag');
});

const typeJob = schedule.scheduleJob('Update type movies','0 0 2 * * *', () => {
  logger.info(typeJob.name);
  updateDynamicMovies('type');
});

const newTagJob = schedule.scheduleJob('Update newTag movies','0 0 3 * * *', () => {
  logger.info(newTagJob.name);
  updateDynamicMovies('newTag');
});

const schedules = [tagJob, typeJob, newTagJob];
export { schedules };
