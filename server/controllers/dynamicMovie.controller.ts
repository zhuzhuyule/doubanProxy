import DynamicMovie, { DynamicMovieType } from '@models/dynamicMovie.model';
import tool from '@utils/tool';

async function update(movie: DynamicMovieType & { tag: string}): Promise<DynamicMovieType | null> {
  const { id, title, rating, tag, tags, types, regions, vote_count, update } = movie;
  const document = {
    $set: {
      id: parseInt(`${id}`, 10),
      rating,
      title,
      vote_count,
      update,
      ...(movie.tags && { tags }),
      ...(movie.types && { types }),
      ...(movie.regions && { regions }),
    },
    $addToSet: {
      ...(tag && { tags: { $each: [tag] }})
    }
  }
  return await tool.updateTable({ id: parseInt(`${id}`, 10) }, document, DynamicMovie.model);
}

async function notFound(id: number): Promise<{_: string}> {
  return await DynamicMovie.model.updateOne({ id }, { $set: { notFound: true }});
}

async function findAll() {
  return await DynamicMovie.model.find({ notFound: { $ne: true }}).then(items => items.map(item => item.id));
}

async function findTagIds(tag: string) {
  return await DynamicMovie.model.find({ tag, notFound: { $ne: true }}).then(items => items.map(item => item.id));
}

// async function findMovieTags (id: string|number) {
//   return await DynamicMovie.model.find({ id: parseInt(`${id}`, 10), notFound: { $ne: true }}).then(items => items.map(item => item.tags || ''));
// }

export default {
  update,
  findAll,
  findTagIds,
  notFound,
  // findMovieTags,
};
