import { findDoubanId, findIMDBId, findSun, searchMovie } from '@services/query';
import { updateDetail, updateMovies, updateProxies } from '@services/update';
import express from 'express'

const router = express.Router();

router.get('/douban/:id', findDoubanId);
router.get('/imdb/:id', findIMDBId);
router.get('/search', searchMovie);
router.get('/proxy/sun', findSun);

router.get('/proxy/update', updateProxies);
router.get('/updateMovies', updateMovies);
router.get('/updateDetails', updateDetail);

export default router;