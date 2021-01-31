import detailMovieCtl from '@controllers/detailMovie.controller';
import dynamicMovieCtrl from '@controllers/dynamicMovie.controller';
import movieCtrl from '@controllers/movie.controller';
import { MovieType } from '@models/movie.model';
import { transferTime } from '@utils/tool';
import { Request, Response } from 'express';
import proxy from './proxy';
import { updateAll, updateDynamicMovies } from './spider';

export async function updateProxies(_: Request, res: Response): Promise<void> {
  await proxy.getAll();
  res.send('Running get all command!')
}

export function updateMovies(req: Request<{ mode: 'tag' | 'type' }>, res: Response): void  {
  updateDynamicMovies(req.params.mode);
  res.send('Running get all command!')
}

export async function updateDetail(_: Request<{ mode: 'tag' | 'type' }>, res: Response): Promise<void>  {
  const ids = await dynamicMovieCtrl.findAll();
  res.send('Running get all command!'+ ids.length );
  updateAll();
}



export async function mergeDynamicMovie(): Promise<void>  {
  const movies = await dynamicMovieCtrl.getAll();
  movies && movies.map(async (movie, index) => {
    // tool.log.split('*', `${index} | ${(index/movies.length * 100).toFixed(2)}%`)
    return movie && await detailMovieCtl.update({
      ...movie,
      voteCount: movie.vote_count,
      title: [movie.title],
      update: transferTime(),
    })
  })
}
export async function mergeMovie(): Promise<void>  {
  const movies = await movieCtrl.find({});
  movies && movies.map(async (movie: MovieType, index) => {
    // tool.log.split('*', `${index} | ${(index/movies.length * 100).toFixed(2)}%`)
    const dynamicMovie = await dynamicMovieCtrl.get(movie.id);
    const movieIsLatest = movie.ratingPeople && (!dynamicMovie?.vote_count || (dynamicMovie.vote_count > movie.ratingPeople));
    const title = [dynamicMovie?.title || ''].concat((movie.title || '')?.replace(new RegExp(dynamicMovie?.title || ''), '').trim().replace(/\(\d+\)$/, ''));
    return await detailMovieCtl.update({
      ...dynamicMovie,
      ...movie,
      rating: (movieIsLatest ? movie.rating : dynamicMovie?.rating) || 0,
      imdb: movie.IMDb,
      betterThan: movie.betterThan?.trim().split(' '),
      voteCount: movieIsLatest ? movie.ratingPeople : dynamicMovie?.vote_count,
      title: title.filter(item => !!item),
      alias: movie.alias?.split('/'),
      update: transferTime(),
      actors: movie.actor?.split('/'),
      tags: dynamicMovie?.tags,
      types: dynamicMovie?.types || movie.type?.split('/'),
      regions: dynamicMovie?.regions || movie.region?.split('/'),
    })
  })
}