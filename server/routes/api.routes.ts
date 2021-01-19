import express from 'express'

import movieCtrl from '@controllers/movie.controller';
import proxyCtrl from '@controllers/proxy.controller';
import dayjs from 'dayjs';
import { DATE_FORMAT } from '@utils/constants';
import tool from '@utils/tool';

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
  const { top = 10, h = 0, m = 0, date = '' } = req.query;
  const proxies = await proxyCtrl.findSun(top, { hour: h, min: m, baseDate: date});
  res.json(proxies && proxies.map(proxy => {
    return {
      proxy: `${proxy.ip}:${proxy.port}`,
      type: proxy.type,
      useCount: proxy.useCount,
      ip: proxy.ip,
      port: proxy.port,
      expire_time: tool.getDateTime(proxy.expire_time),
      invalidTime: tool.getDateTime(proxy.invalidTime),
    }
  }));
}

export default router
