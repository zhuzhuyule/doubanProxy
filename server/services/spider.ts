import movieCtrl from '@controllers/movie.controller';
import dynamicMovieCtrl from '@controllers/dynamicMovie.controller';
import tool from '@utils/tool';
import { searchMoviesByTag, searchMoviesByType, searchMovie } from './request';
import { MovieType } from '@models/movie.model';

async function updateTypes(types, level) {
  try {
    for (let typeIndex = 0; typeIndex < types.length; typeIndex++) {
      const type = types[typeIndex];
      console.log('');
      tool.log.split('*');
      console.log(`Start getting "${type}" type and level "${level}" movie`);
      const movies = await searchMoviesByType(type, level);
      for (let idIndex = 0; idIndex < movies.length; idIndex++) {
        const movie = movies[idIndex];
        if (movie && movie.id && type) {
          await dynamicMovieCtrl.update({
            ...movie,
            rating: movie.score || '0',
            update: tool.transferTime(),
          });
        }
      }
      console.log(`End getting "${type}" type movie`);
    }
  } catch (e) {
    console.error(`Sorry! Find some errors, The operate will done`);
    console.error(`Error Info:`);
    console.error(e);
  } finally {
    console.log(`------------Update Movie By Type End------------`);
  }
}

async function updateTags(tags: string[]) {
  try {
    for (let tagIndex = 0; tagIndex < tags.length; tagIndex++) {
      const tag = tags[tagIndex];
      console.log('');
      tool.log.split('*');
      console.log(`Start getting "${tag}" tag movie`);
      const movies = await searchMoviesByTag(tag);
      for (let idIndex = 0; idIndex < movies.length; idIndex++) {
        const movie = movies[idIndex];
        if (movie.id && tag) {
          await dynamicMovieCtrl.update({
            ...movie,
            tag,
            update: tool.transferTime(),
          });
        }
      }
      console.log(`End getting "${tag}" tag movie`);
      console.log('');
    }
  } catch (e) {
    console.error(`Sorry! Find some errors, The operate will done`);
    console.error(`Error Info:`);
    console.error(e);
  } finally {
    console.log(`------------Update Movie By Tags End------------`);
  }
}

export async function updateDetailMovies(ids: string[]): Promise<string[]> {
  let failedCount = 0;
  const list  = ids.splice(0, 100);
  for (let idIndex = 0; idIndex < list.length; idIndex++) {
    const id = list[idIndex];
    console.log('');
    tool.log.split('*');
    let movie = await movieCtrl.findOneById(id);
    if (movie) {
      console.log(`The [${idIndex}] "${id}" movie has existed! 《${movie.title}》`);
    } else {
      movie = await getMovie(id);
      if (movie) {
        failedCount = 0;
        if (movie.notFound) {
          console.error(`Skip [${idIndex}] "${id}" movie`);
        } else {
          console.log(`The [${idIndex}] "${id}" has saved!《${movie.title}》`);
        }
      } else {
        failedCount++;
        console.error(`The [${idIndex}]  movie save failure`);
        if (failedCount === 15) {
          throw new Error('There is a problem with the network and try again later！');
        }
      }
    }
  }
  return ids;
}

async function getMovie(id: string, isRetry = false): Promise<MovieType | null> {
  const movie = await searchMovie(id)
    .then(async (movie) => {
      if (movie && movie.notFound) {
        await dynamicMovieCtrl.notFound(movie.id);
        console.warn(`Update [${movie.id}] movie info!`);
      } else if (movie && !movie.notFound) {
        await movieCtrl.update(movie).catch(console.log);
        console.log(`Saved the '${movie.id}' 《${movie.title}》 success!`);
      }
      return movie;
    })
    .catch(async (e) => {
      if ([404].indexOf(e.status) > -1 && e.id) {
        await dynamicMovieCtrl.notFound(e.id);
        console.log(`Skip the [${e.id}] movie!`);
        return {
          id: e.id,
          notFound: true,
        };
      }
      if (!isRetry) {
        console.error(`Try again! Get id:${id} movie`);
        return await getMovie(id, true);
      }
      return null;
    });
  if (!movie && !isRetry) {
    console.error(`Failed! Get id:${id} movie failed！|`);
  }
  return movie;
}


// const tags = ['热门', '最新', '经典', '可播放', '豆瓣高分', '冷门佳片', '华语', '欧美', '韩国', '日本', '动作', '喜剧', '爱情', '科幻', '悬疑', '恐怖', '文艺'];
const tags = ['热门', '最新'];
const types = ['科幻', '剧情', '喜剧', '动作', '爱情', '动画', '悬疑', '惊悚', '恐怖', '纪录片', '短片', '情色', '同性', '音乐', '歌舞', '家庭', '儿童', '传记', '历史', '战争', '犯罪', '西部', '奇幻', '冒险', '灾难', '武侠', '古装', '运动', '黑色电影'];
export async function updateDynamicMovies(mode: 'type' | 'tag'): Promise<void> {
  try {
    if (mode === 'tag') {
      await updateTags(tags);
    } else {
      for (let i = 0; i < 10; i++) {
        console.log('loop log', i);
        await updateTypes(types, i);
      }
    }
    await updateAll();
  } catch (e) {
    console.error(`Sorry, getting movie failed:`);
    console.error(e);
  } finally {
    console.log(`------------End update dynamic movies------------`);
  }
}

export async function updateAll(): Promise<void> {
  try {
    console.log('Ready update detail movie');
    let ids = await dynamicMovieCtrl.findAll();
    console.log('Totally have movie:', ids.length);
    while (ids.length > 0) {
      ids = await updateDetailMovies(ids)
    }
  } catch (e) {
    console.error(`Sorry, Found some errors:`);
    console.error(e);
  } finally {
    console.log(`------------End update detail movie infos------------`);
  }
}

