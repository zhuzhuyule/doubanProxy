import Movie, { MovieType } from '@models/movie.model';
import tool from '@utils/tool';

function update (movie: MovieType) {
  return tool.updateTable({ id: movie.id }, movie, Movie.model);
}

function findOne (query: any) {
  return Movie.model.findOne(query).then(formatMovie);
}

function find(query: any) {
  return Movie.model.find(query).then(movies => movies.map(formatMovie));
}

function findOneById (id: string | number) {
  return Movie.model.findOne({ id: parseInt(`${id}`, 10) }).then(formatMovie);
}

function formatMovie(movie: MovieType | null) {
  return movie && {
    id: movie.id,
    title: movie.title,
    year: movie.year,
    alias: movie.alias,
    actor: movie.actor,
    type: movie.type,
    region: movie.region,
    date: movie.date,
    time: movie.time,
    IMDb: movie.IMDb,
    ratingPeople: movie.ratingPeople,
    betterThan: movie.betterThan,
    rating: movie.rating,
  }
}

export default {
  update,
  find,
  findOne,
  findOneById,
};
