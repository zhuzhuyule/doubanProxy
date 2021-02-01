import DetailMovie, { DetailMovieType } from '@models/detailMovie';
import { updateTable } from '@utils/tool';
import { FilterQuery } from 'mongoose';

async function update(movie: DetailMovieType): Promise<DetailMovieType | null> {
  const { id, imdb, rating, voteCount,title,alias,time, date, actors,tags, types,betterThan,regions, update, notFound, coverId} = movie;
  const document = {
    $set: {
      id: parseInt(`${id}`, 10),
      coverId,
      imdb,
      rating: parseFloat(`${rating || 0}`) || 0,
      voteCount,
      time,
      date,
      update,
      notFound,
    },
    $addToSet: {
      ...(title && { title: { $each: title }}),
      ...(alias && { alias: { $each: alias }}),
      ...(actors && { actors: { $each: actors }}),
      ...(tags && { tags: { $each: tags }}),
      ...(types && { types: { $each: types }}),
      ...(regions && { regions: { $each: regions }}),
      ...(betterThan && { betterThan: { $each: betterThan }}),
    }
  }
  return await updateTable({ id: parseInt(`${id}`, 10) }, document, DetailMovie.model);
}

function find(query: FilterQuery<DetailMovieType>): Promise<any | null> {
  return DetailMovie.model.find(query).then(movies => movies.map(formatMovie));
}

async function notFound(id: number): Promise<{_: string}> {
  return await DetailMovie.model.updateOne({ id }, { $set: { notFound: true }});
}

async function findAll(): Promise<string[]> {
  return await DetailMovie.model.find({ notFound: { $ne: true }}).then(items => items.map(item => item.id));
}

async function findTagIds(tag: string): Promise<string[]>  {
  return await DetailMovie.model.find({ tag, notFound: { $ne: true }}).then(items => items.map(item => item.id));
}

function formatMovie(movie: DetailMovieType | null) {
  return movie && {
    id: movie.id,
    title: movie.title,
    coverId: movie.coverId,
    update: movie.update,
    alias: movie.alias,
    actors: movie.actors,
    types: movie.types,
    regions: movie.regions,
    date: movie.date,
    time: movie.time,
    imdb: movie.imdb,
    ratingPeople: movie.voteCount,
    betterThan: movie.betterThan,
    rating: movie.rating,
  }
}

export default {
  update,
  find,
  findAll,
  findTagIds,
  notFound,
};
