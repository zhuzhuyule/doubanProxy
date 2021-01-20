import express from 'express'

import movieCtrl from '@controllers/movie.controller';
import proxyCtrl from '@controllers/proxy.controller';

const router = express.Router() 
router.get('/douban/:id', findDoubanId)
router.get('/imdb/:id', findIMDBId);
router.get('/search', searchMovie);
router.get('/proxy/sun', findSun);

async function findDoubanId(req: any, res: { json: (_: any) => void }) {
    const movie = await movieCtrl.findOneById(req.params.id);
    res.json(movie)
}

async function findIMDBId(req: any, res: { json: (_: any) => void }) {
  const movie = await movieCtrl.findOne({
    IMDb: req.params.id
  });
  res.json(movie);
}
async function searchMovie(req: any, res: any) {
  console.log(req);
  const { name, id, imdb, year, alias, actor } = req.query;
  const movie = await movieCtrl.find({
    ...(name && { title: new RegExp(name) }),
    ...(id && { id: parseInt(id, 10) }),
    ...(imdb && { IMDb: imdb }),
    ...(year && { year: parseInt(year, 10) }),
    ...(alias && { alias: new RegExp(alias) }),
    ...(actor && { actor: new RegExp(actor) }),
  });
  res.json(movie);
}

async function findSun(req: any, res: any) {
  const { top = 10, h = 0, m = 0, date = '', valid = false } = req.query;
  let proxies;
  if (valid) {
    proxies = await proxyCtrl.getValidProxies('sun');
  } else {
    proxies = await proxyCtrl.getProxies({ type: 'sun', top: parseInt(top), hour: parseInt(h), min: parseInt(m), baseDate: date});
  }
  res.json(proxies);
}

export default router
