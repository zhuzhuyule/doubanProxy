import Movie, { MovieType } from '@models/movie.model';
import tool from '@utils/tool';

async function update (movie: MovieType) {
  return await tool.updateTable({ id: movie.id }, movie, Movie.model);
}

async function findOne (query: any) {
  return await Movie.model.findOne(query);
}

async function find(query: any) {
  return await Movie.model.find(query);
}

async function findOneById (id: string | number) {
  const model = Movie.model;
  return await Movie.model.findOne({ id: parseInt(`${id}`, 10) });
}

export default {
  update,
  find,
  findOne,
  findOneById,
};
