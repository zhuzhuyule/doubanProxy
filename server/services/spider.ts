import logSymbol from 'log-symbols';
import movieCtrl from '@controllers/movie';
import dynamicMovieCtrl from '@controllers/dynamicMovie';
import { calcProcess, getCoverImageId, transferTime } from '@utils/tool';
import { searchMoviesByTag, searchMoviesByType, searchMovie, selectMoviesByType } from './request';
import { MovieType } from '@models/movie';
import { DynamicMovieType } from '@models/dynamicMovie';
import { getGlobalContext, getLogger } from '@utils/logger';
import { mergeMovie } from './update';

const logger = getLogger();

const LEVEL_MOVIE_TYPES = ['科幻', '剧情', '喜剧', '动作', '爱情', '动画', '悬疑', '惊悚', '恐怖', '纪录片', '短片', '情色', '同性', '音乐', '歌舞', '家庭', '儿童', '传记', '历史', '战争', '犯罪', '西部', '奇幻', '冒险', '灾难', '武侠', '古装', '运动', '黑色电影'];
async function updateAccordingTypesAndLevel(types = LEVEL_MOVIE_TYPES) {
  const OPERATE_NAME = 'updateAccordingTypesAndLevel';

  const status = getGlobalContext(OPERATE_NAME);
  if (status) {
     logger.warn(status)
     return status
  }
  try {
    let [level = 0, typeIndex = 0] = await logger.initialOperate(OPERATE_NAME) as number[];
    for (; level < 10; level++) {
      for (let len = types.length; typeIndex < len; typeIndex++) {
        const type = types[typeIndex];

        const title = `Update "${type}" type movie [l.${level}] | ${calcProcess(typeIndex + (level * len), len * 10)}`;
        const endMsg = `End getting "${type}" type movie [l.${level}]`;
        await logger.execOperate(title, endMsg, { operate: OPERATE_NAME, args: [level, typeIndex] }, async () => {
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
        })
      }
    }
  } catch (e) {
    logger.error(logSymbol.error, `Sorry! Find some errors, The operate will done`);
    logger.error(logSymbol.error, `Error Info:`);
    logger.error(logSymbol.error, e);
  } finally {
    logger.info(`------------Update Movie By Type End------------`);
    logger.removeGlobalContext('', OPERATE_NAME);
  }
}

const NEW_MOVIE_TAGS = ["科幻", "喜剧", "奇幻", "冒险", "灾难", "动作", "武侠", "爱情", "动画", "悬疑", "惊悚", "恐怖", "剧情", "犯罪", "同性", "音乐", "歌舞", "传记", "历史", "战争", "西部", "情色"]
async function updateNewTags(tags = NEW_MOVIE_TAGS) {
  const OPERATE_NAME = 'updateNewTags';

  const status = getGlobalContext(OPERATE_NAME);
  if (status) {
     logger.warn(status)
     return status
  }
  try {
    const pageLimit = 300;

    // eslint-disable-next-line prefer-const
    let [tagIndex = 0, page = 0] = await logger.initialOperate(OPERATE_NAME) as number[];
    let start = page * 300;
    for (let len = tags.length; tagIndex < len; tagIndex++) {
      const tag = tags[tagIndex];
      let movies: Array<DynamicMovieType & { cover?: string }> = [];

      logger.addGlobalContext(`Update "${tag}" tag movie | ${calcProcess(tagIndex, len)}`);
      do {
        const page = Math.round(start/pageLimit)+1;
        const title = `Start getting "${tag}" in ${page} page movies!`;
        const endMsg = `End getting "${tag}" in ${page} page movies! Total: ${start}`;
        await logger.execOperate(title, endMsg, { operate: OPERATE_NAME, args: [tagIndex, page] }, async () => {
          movies = await selectMoviesByType(tag, start, pageLimit);
          start = movies.length + start;
  
          for (let idIndex = 0; idIndex < movies.length; idIndex++) {
            const movie = movies[idIndex];
            if (movie.id && tag) {
              await dynamicMovieCtrl.update({
                ...movie,
                tag,
                coverId: getCoverImageId(movie.cover || movie.coverId),
                update: transferTime(),
              });
            }
          }
        })
      } while (movies.length > 0);
      start = 0;
      logger.removeGlobalContext(`End getting "${tag}" type movie`);
    }
  } catch (e) {
    logger.error(logSymbol.error, `Sorry! Find some errors, The operate will done`);
    logger.error(logSymbol.error, `Error Info:`);
    logger.error(logSymbol.error, e);
  } finally {
    logger.info(`------------Update Movie By Tags End------------`);
    logger.removeGlobalContext('', OPERATE_NAME);
  }
}

const NORMAL_MOVIE_TYPES = ['热门', '最新', '经典', '可播放', '豆瓣高分', '冷门佳片', '华语', '欧美', '韩国', '日本', '动作', '喜剧', '爱情', '科幻', '悬疑', '恐怖', '文艺'];
async function updateOldTags(tags = NORMAL_MOVIE_TYPES) {
  const OPERATE_NAME = 'updateOldTags';

  const status = getGlobalContext(OPERATE_NAME);
  if (status) {
     logger.warn(status)
     return status
  }
  try {
    let [tagIndex = 0] = await logger.initialOperate(OPERATE_NAME) as number[];

    for (let len = tags.length; tagIndex < len; tagIndex++) {
      const tag = tags[tagIndex];
      const title = `Start getting "${tag}" movies!`;
      const endMsg = `End getting "${tag}" movies!`;
      await logger.execOperate(title, endMsg, { operate: OPERATE_NAME, args: [tagIndex] }, async () => {
        const movies = await searchMoviesByTag(tag);
        for (let idIndex = 0; idIndex < movies.length; idIndex++) {
          const movie: DynamicMovieType & { cover?: string } = movies[idIndex];
          if (movie.id && tag) {
            await dynamicMovieCtrl.update({
              ...movie,
              tag,
              coverId: getCoverImageId(movie.cover || movie.coverId),
              update: transferTime(),
            });
          }
        }
      });
    }
  } catch (e) {
    logger.error(logSymbol.error, `Sorry! Find some errors, The operate will done`);
    logger.error(logSymbol.error, `Error Info:`);
    logger.error(logSymbol.error, e);
  } finally {
    logger.info(`------------Update Movie By Tags End------------`);
    logger.removeGlobalContext('', OPERATE_NAME);
  }
}

export async function updateDetailMovies(ids: string[]): Promise<string> {
  const OPERATE_NAME = 'updateDetailMovies';

  const status = getGlobalContext(OPERATE_NAME) as string;
  if (status) {
     logger.warn(status)
     return status
  }
  let failedCount = 0;
  let skipCount = 0;
  let [idIndex = 0] = await logger.initialOperate(OPERATE_NAME) as number[];

  try {
    for (; idIndex < ids.length; idIndex++) {
      const id = ids[idIndex];
      let movie = await movieCtrl.findOneById(id);
      logger.addGlobalContext('', OPERATE_NAME, `[current index: ${idIndex+1}] [${calcProcess(idIndex, ids.length)}]`);
      if (movie) {
        skipCount++;
        if (skipCount % 500 === 0) {
          logger.info(`Has skiped "${skipCount}" existed movies! [current index: ${idIndex+1}] [${calcProcess(idIndex, ids.length)}]`);
          skipCount = 0;
        }
      } else {
        if (skipCount > 0) {
          logger.info(`Has skiped "${skipCount}" existed movies! [current index: ${idIndex+1}] [${calcProcess(idIndex, ids.length)}]`);
        }
        skipCount = 0;
  
        const title = `Start request movie! [id: ${id} | current index: ${idIndex+1}] [${calcProcess(idIndex, ids.length)}]`;
        const endMsg = `End get the [id: ${id}]`;
        logger.addGlobalContext(title);
        movie = await requestSingleMovie(id);
        if (movie) {
          failedCount = 0;
          if (movie.notFound) {
            logger.error(`Skip [${idIndex}] "${id}" movie`);
          } else {
            logger.info(`The [${idIndex}] "${id}" has saved!《${movie.title}》`);
          }
        } else {
          failedCount++;
          logger.error(`The [${idIndex}] movie save failure`);
          if (failedCount === 15) {
            throw new Error('There is a problem with the network and try again later！');
          }
        }
        logger.removeGlobalContext(endMsg);
      }
    }
    if (skipCount !== 0) {
      logger.info(`Has skiped "${skipCount}" existed movies! [current index: ${ids.length}]`);
    }
  } finally {
    logger.removeGlobalContext('', OPERATE_NAME);
  }
  return `Ended ${OPERATE_NAME}`;
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


export async function updateDynamicMovies(mode?: string): Promise<void> {
  try {
    if (mode === 'newTag') {
      await updateNewTags();
    } else if (mode === 'tag') {
      await updateOldTags();
    } else {
      await updateAccordingTypesAndLevel();
    }
    await updateAll();
    await mergeMovie();
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

