import detailMovieController from '@controllers/detailMovie';
import movieCtrl from '@controllers/movie';
import { DetailMovieType } from '@models/detailMovie';
import { getGlobalContext, getLogger } from '@utils/logger';
import { getCoverLink, similarity } from '@utils/tool';
import express from 'express';

export async function findDoubanId(req: express.Request, res: express.Response): Promise<void>  {
  const movie = await movieCtrl.findOneById(req.params.id);
  res.json(movie)
}

export async function findIMDBId(req: express.Request, res: express.Response): Promise<void>  {
  const movie = await movieCtrl.findOne({
    IMDb: req.params.id
  });
  res.json(movie);
}

export async function getStatus(_: express.Request, res: express.Response): Promise<void>  {
  const operates = ['updateAccordingTypesAndLevel', 'updateNewTags','updateOldTags','updateDetailMovies'];
  const result = operates.map(operate => ({[operate]: getGlobalContext(operate) || 'Done'}));
  res.json(result);
}

export async function searchMovie(req: express.Request, res: express.Response): Promise<void>  {
  const { name, title, alias, id, imdb, actor, year,  all } = req.query;
  //new police => new.*?police; 新 故事 => 新.*?故事
  const titleContent = `${name || title || alias || ''}`.replace(/ /g, '.*?');
  // newPolice => new ?Police
  const titleSplit = titleContent.replace(/([[0-9a-zA-Z]])([A-Z])/g, '$1 ?$2');
  const titleReg = new RegExp(titleSplit.replace(/\(?\d{3,4}\)?$/, ''), 'i');
  
  const movies: DetailMovieType[] = await detailMovieController.find({
    ...(titleContent && {
      $or: [
        { title: titleReg },
        { alias: titleReg },
      ],
    }),
    ...(id && { id: parseInt(id.toString(), 10) }),
    ...(imdb && { imdb: imdb.toString() }),
    ...(actor && { actors: new RegExp(actor.toString(), 'i') }),
    ...(year && { date: new RegExp(year.toString(), 'i') }),
  });
  
  const list = movies.map(movie => {
    const titleSimilar = movie.title.map(item => similarity(`${name}`, item)).reduce((max, item) => item > max ? item : max, 0);
    const aliasSimilar = movie.alias?.map(item => similarity(`${alias}`, item)).reduce((max, item) => item > max ? item : max, 0) || 0;
    
    return {
      ...movie,
      url: `https://movie.douban.com/subject/${movie.id}/`,
      cover: getCoverLink(movie.coverId || 0),
      similarityScore: Math.max(titleSimilar * 10, aliasSimilar * 5)
    }
  }).sort((movie1, movie2) => {
    if (movie1.similarityScore > movie2.similarityScore) {
      return -1;
    }
    if (movie1.similarityScore === movie2.similarityScore) {
      if (movie1.date && movie2.date && movie1.date < movie2.date){
        return -1;
      }
      if (movie1.voteCount && movie2.voteCount && movie1.voteCount < movie2.voteCount){
        return -1;
      }
    }
    return 1
  });
  res.json(all ? list : list.splice(0, 5));
}
