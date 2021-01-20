import movieCtrl from '@controllers/movie.controller';
import proxyCtrl from '@controllers/proxy.controller';
import express from 'express';
import proxy from './proxy';

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

export async function searchMovie(req: express.Request, res: express.Response): Promise<void>  {
  console.log(req);
  const { name, id, imdb, year, alias, actor } = req.query;
  const movie = await movieCtrl.find({
    ...(name && { title: new RegExp(name.toString()) }),
    ...(id && { id: parseInt(id.toString(), 10) }),
    ...(imdb && { IMDb: imdb }),
    ...(year && { year: parseInt(year.toString(), 10) }),
    ...(alias && { alias: new RegExp(alias.toString()) }),
    ...(actor && { actor: new RegExp(actor.toString()) }),
  });
  res.json(movie);
}

export async function findSun(req: express.Request, res: express.Response): Promise<void> {
  const { top = 10, h = 0, m = 0, date = '', valid = false } = req.query;
  let proxies;
  if (valid) {
    proxies = await proxyCtrl.getValidProxies('sun', parseInt(top.toString()));
  } else {
    proxies = await proxyCtrl.getProxies({ type: 'sun', top: parseInt(top.toString()), hour: parseInt(h.toString()), min: parseInt(m.toString()), baseDate: date.toString() });
  }
  res.json(proxies);
}

export function getAll(_: express.Request, res: express.Response): void {
  proxy.getAll();
  res.send('Running get all command!')
}