import detailMovieCtl from '@controllers/detailMovie';
import dynamicMovieCtrl from '@controllers/dynamicMovie';
import movieCtrl from '@controllers/movie';
import { MovieType } from '@models/movie';
import { transferTime } from '@utils/tool';
import { Request, Response } from 'express';
import { updateAll, updateDynamicMovies } from './spider';

export function updateMovies(req: Request, res: Response): void  {
  const { mode } = req.query;
  updateDynamicMovies(mode?.toString());
  setTimeout(() => {
    res.redirect('/api/status')
  }, 2000);
}

export async function updateDetail(_: Request, res: Response): Promise<void>  {
  updateAll();
  setTimeout(() => {
    res.redirect('/api/status')
  }, 2000);
}

export async function mergeDynamicMovie(): Promise<void>  {
  const movies = await dynamicMovieCtrl.getAll();
  movies && movies.map(async (movie) => {
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
  movies && movies.map(async (movie: MovieType) => {
    const dynamicMovie = await dynamicMovieCtrl.get(movie.id);
    const movieIsLatest = movie.ratingPeople && (!dynamicMovie?.vote_count || (dynamicMovie.vote_count > movie.ratingPeople));
    const title = [dynamicMovie?.title || ''].concat((movie.title || '')?.replace(new RegExp(dynamicMovie?.title || ''), '').trim().replace(/\(\d+\)$/, ''));
    return await detailMovieCtl.update({
      id: movie.id,
      imdb: movie.IMDb,
      coverId: dynamicMovie?.coverId || movie.coverId,
      rating: (movieIsLatest ? movie.rating : dynamicMovie?.rating) || 0,
      voteCount: movieIsLatest ? movie.ratingPeople : dynamicMovie?.vote_count,
      title: title.filter(item => !!item),
      alias: movie.alias?.split('/'),
      time: movie.time,
      date: movie.date,
      actors: movie.actor?.split('/'),
      tags: dynamicMovie?.tags,
      types: dynamicMovie?.types || movie.type?.split('/'),
      betterThan: movie.betterThan?.trim().split(' '),
      regions: dynamicMovie?.regions || movie.region?.split('/'),
      update: transferTime(),
    })
  })
}