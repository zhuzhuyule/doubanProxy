import DynamicMovie, { DynamicMovieType } from '@models/dynamicMovie';
import { updateTable } from '@utils/tool';

async function update(movie: DynamicMovieType & { tag?: string}): Promise<DynamicMovieType | null> {
  const { id, title, rating, tag, tags, types, regions, vote_count, update, coverId } = movie;
  const document = {
    $set: {
      id: parseInt(`${id}`, 10),
      rating,
      title,
      vote_count,
      coverId,
      update,
      ...(movie.tags && { tags }),
      ...(movie.types && { types }),
      ...(movie.regions && { regions }),
    },
    $addToSet: {
      ...(tag && { tags: { $each: [tag] }})
    }
  }
  return await updateTable({ id: parseInt(`${id}`, 10) }, document, DynamicMovie.model);
}

async function notFound(id: number): Promise<{_: string}> {
  return await DynamicMovie.model.updateOne({ id }, { $set: { notFound: true }});
}

async function findAll(): Promise<string[]> {
  return await DynamicMovie.model.find({ notFound: { $ne: true }}).then(items => items.map(item => item.id));
}

async function getAll(): Promise<Array<DynamicMovieType | null> | null> {
  return await DynamicMovie.model.find().then(formatMovie);
}

async function get(id: number): Promise<DynamicMovieType | null> {
  return await DynamicMovie.model.find({ id }).then(movies => {
    const list = formatMovie(movies);
    return list && list[0];
  });
}

async function findTagIds(tag: string): Promise<string[]>  {
  return await DynamicMovie.model.find({ tag, notFound: { $ne: true }}).then(items => items.map(item => item.id));
}

function formatMovie(movies: Array<DynamicMovieType | null> | null) {
  return movies && movies.map(movie => movie && {
    id: movie.id,
    title: movie.title,
    coverId: movie.coverId,
    rating: movie.rating,
    tags: movie.tags,
    types: movie.types,
    regions: movie.regions,
    vote_count: movie.vote_count,
    notFound: movie.notFound,
    update: movie.update,
  })
}

export default {
  update,
  findAll,
  findTagIds,
  notFound,
  getAll,
  get,
};
