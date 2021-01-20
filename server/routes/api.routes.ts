import { findDoubanId, findIMDBId, findSun, getAll, searchMovie } from '@services/operate';
import express from 'express'

const router = express.Router();

router.get('/douban/:id', findDoubanId);
router.get('/imdb/:id', findIMDBId);
router.get('/search', searchMovie);
router.get('/proxy/sun', findSun);

router.get('/proxy/get-all', getAll);
