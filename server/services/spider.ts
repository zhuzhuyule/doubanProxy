import logSymbol from 'log-symbols';
import { LOG_CONTEXT_KEYS } from '@utils/constants';
import movieCtrl from '@controllers/movie.controller';
import dynamicMovieCtrl from '@controllers/dynamicMovie.controller';
import { calcProcess, getCoverImageId, transferTime } from '@utils/tool';
import { searchMoviesByTag, searchMoviesByType, searchMovie, selectMoviesByType } from './request';
import { MovieType } from '@models/movie.model';
import { DynamicMovieType } from '@models/dynamicMovie.model';
import { getLogger, loggerContext } from '@utils/logger';

const logger = getLogger();

async function updateTypes(types, level) {
  try {
    for (let typeIndex = 0, len = types.length; typeIndex < len; typeIndex++) {
      const type = types[typeIndex];
      const formatTitle = loggerContext.addContext(LOG_CONTEXT_KEYS.operate, {});
      const title = `Update "${type}" type movie [${level}] | ${calcProcess(typeIndex, len)}`;
      logger.trace(formatTitle(title));
      const movies = await searchMoviesByType(type, level);
      for (let idIndex = 0; idIndex < movies.length; idIndex++) {
        const movie = movies[idIndex];
        if (movie && movie.id && type) {
          await dynamicMovieCtrl.update({
            ...movie,
            rating: movie.score || '0',
            coverId: getCoverImageId(movie.cover_url),
            update: transferTime(),
          });
        }
      }
      logger.trace(`End getting "${type}" type movie`);
      loggerContext.removeContext(LOG_CONTEXT_KEYS.operate);
    }
  } catch (e) {
    logger.error(logSymbol.error, `Sorry! Find some errors, The operate will done`);
    logger.error(logSymbol.error, `Error Info:`);
    logger.error(logSymbol.error, e);
  } finally {
    logger.info(`------------Update Movie By Type End------------`);
    logger.removeContext('operate');
  }
}

const MOVIE_TAGS = ["科幻", "喜剧", "奇幻", "冒险", "灾难", "动作", "武侠", "爱情", "动画", "悬疑", "惊悚", "恐怖", "剧情", "犯罪", "同性", "音乐", "歌舞", "传记", "历史", "战争", "西部", "情色"]
async function updateTagsNew(tags: string[]) {
  try {
    for (let tagIndex = 0, len = tags.length; tagIndex < len; tagIndex++) {
      const tag = tags[tagIndex];
      const formatTitle = loggerContext.addContext(LOG_CONTEXT_KEYS.operate, {});
      const title = `Update "${tag}" tag movie | ${calcProcess(tagIndex, len)}`;
      logger.trace(formatTitle(title));
      const pageLimit = 300;
      let total = 0;
      let movies: Array<DynamicMovieType & { cover_url?: string }> = [];
      do {
        logger.info(`Start getting ${Math.round(total/pageLimit)+1} page movies!`);
        movies = await selectMoviesByType(tag, total, pageLimit);
        total = movies.length + total;

        logger.info(`Had got ${movies.length} movies in page ${Math.round(total/pageLimit)+1}! Total: ${total}`);
        for (let idIndex = 0; idIndex < movies.length; idIndex++) {
          const movie = movies[idIndex];
          if (movie.id && tag) {
            await dynamicMovieCtrl.update({
              ...movie,
              tag,
              coverId: getCoverImageId(movie.cover_url),
              update: transferTime(),
            });
          }
        }
      } while (movies.length > 0);
      
      logger.info(`End getting "${tag}" tag movie`);
      loggerContext.removeContext(LOG_CONTEXT_KEYS.operate);
    }
  } catch (e) {
    logger.error(logSymbol.error, `Sorry! Find some errors, The operate will done`);
    logger.error(logSymbol.error, `Error Info:`);
    logger.error(logSymbol.error, e);
  } finally {
    logger.info(`------------Update Movie By Tags End------------`);
  }
}

async function updateTags(tags: string[]) {
  try {
    for (let tagIndex = 0, len = tags.length; tagIndex < len; tagIndex++) {
      const tag = tags[tagIndex];
      const formatTitle = loggerContext.addContext(LOG_CONTEXT_KEYS.operate, {});
      const title = `Update "${tag}" tag movie | ${calcProcess(tagIndex, len)}`;
      logger.trace(formatTitle(title));
      const movies = await searchMoviesByTag(tag);
      for (let idIndex = 0; idIndex < movies.length; idIndex++) {
        const movie = movies[idIndex];
        if (movie.id && tag) {
          await dynamicMovieCtrl.update({
            ...movie,
            tag,
            update: transferTime(),
          });
        }
      }
      logger.info(`End getting "${tag}" tag movie`);
      loggerContext.removeContext(LOG_CONTEXT_KEYS.operate);
    }
  } catch (e) {
    logger.error(logSymbol.error, `Sorry! Find some errors, The operate will done`);
    logger.error(logSymbol.error, `Error Info:`);
    logger.error(logSymbol.error, e);
  } finally {
    logger.info(`------------Update Movie By Tags End------------`);
  }
}

export async function updateDetailMovies(ids: string[]): Promise<string[]> {
  let failedCount = 0;
  let skipCount = 0;
  const formatTitle = loggerContext.addContext(LOG_CONTEXT_KEYS.operate, {});
  logger.info(formatTitle('Start update detail movies'));
  for (let idIndex = 0; idIndex < ids.length; idIndex++) {
    const id = ids[idIndex];
    let movie = await movieCtrl.findOneById(id);
    if (movie) {
      skipCount++;
      if (skipCount % 500 === 0) {
        logger.info(`Has skiped "${skipCount}" existed movies! [current index: ${idIndex+1}]`);
        skipCount = 0;
      }
    } else {
      logger.info(`Has skiped "${skipCount}" existed movies! [current index: ${idIndex+1}]`);
      logger.info(`Start request movie! [id: ${id} | current index: ${idIndex+1}]`);
      skipCount = 0;
      movie = await requestSingleMovie(id);
      if (movie) {
        failedCount = 0;
        if (movie.notFound) {
          logger.error(logSymbol.error, `Skip [${idIndex}] "${id}" movie`);
        } else {
          logger.info(`The [${idIndex}] "${id}" has saved!《${movie.title}》`);
        }
      } else {
        failedCount++;
        logger.error(logSymbol.error, `The [${idIndex}] movie save failure`);
        if (failedCount === 15) {
          throw new Error('There is a problem with the network and try again later！');
        }
      }
    }
  }
  if (skipCount !== 0) {
    logger.info(`Has skiped "${skipCount}" existed movies! [current index: ${ids.length}]`);
  }
  loggerContext.removeContext(LOG_CONTEXT_KEYS.operate);
  return ids;
}

async function requestSingleMovie(id: string, isRetry = false): Promise<MovieType | null> {
  const movie = await searchMovie(id)
    .then(async (movie) => {
      if (movie && movie.notFound) {
        await dynamicMovieCtrl.notFound(movie.id);
        logger.warn(`Update [${movie.id}] movie info!`);
      } else if (movie && !movie.notFound) {
        await movieCtrl.update(movie).catch(logger.info);
        logger.info(`Saved the '${movie.id}' 《${movie.title}》 success!`);
      }
      return movie;
    })
    .catch(async (e) => {
      if (e.status == '500') {
        logger.error(logSymbol.error, e.message);
        return null;
      }
      if ([404].indexOf(e.status) > -1 && e.id) {
        await dynamicMovieCtrl.notFound(e.id);
        logger.info(`Skip the [${e.id}] movie!`);
        return {
          id: e.id,
          notFound: true,
        };
      }
      if (!isRetry) {
        logger.error(logSymbol.error, `Try again! Get id:${id} movie`);
        return await requestSingleMovie(id, true);
      }
      return null;
    });
  if (!movie && !isRetry) {
    logger.error(logSymbol.error, `Failed! Get id:${id} movie failed！|`);
  }
  return movie;
}


const tags = ['热门', '最新', '经典', '可播放', '豆瓣高分', '冷门佳片', '华语', '欧美', '韩国', '日本', '动作', '喜剧', '爱情', '科幻', '悬疑', '恐怖', '文艺'];
// const tags = ['热门', '最新'];
const types = ['科幻', '剧情', '喜剧', '动作', '爱情', '动画', '悬疑', '惊悚', '恐怖', '纪录片', '短片', '情色', '同性', '音乐', '歌舞', '家庭', '儿童', '传记', '历史', '战争', '犯罪', '西部', '奇幻', '冒险', '灾难', '武侠', '古装', '运动', '黑色电影'];
export async function updateDynamicMovies(mode: 'type' | 'tag' | 'newTag'): Promise<void> {
  try {
    if (mode === 'newTag') {
      await updateTagsNew(MOVIE_TAGS);
    } else if (mode === 'tag') {
      await updateTags(tags);
    } else {
      for (let i = 0; i < 10; i++) {
        await updateTypes(types, i);
      }
    }
    await updateAll();
  } catch (e) {
    logger.error(logSymbol.error, `Sorry, getting movie failed:`);
    logger.error(logSymbol.error, e);
  } finally {
    logger.info(`------------End update dynamic movies------------`);
  }
}

export async function updateAll(): Promise<void> {
  try {
    logger.info('Ready update detail movie');
    const ids = await dynamicMovieCtrl.findAll();
    logger.info('Totally have movie:', ids.length);
    await updateDetailMovies(ids)
  } catch (e) {
    logger.error(logSymbol.error, `Sorry, Found some errors:`);
    logger.error(logSymbol.error, e);
  } finally {
    logger.info(`------------End update detail movie infos------------`);
  }
}

