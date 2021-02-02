import { findDoubanId, findIMDBId, searchMovie } from '@services/query';
import { updateDetail, updateMovies } from '@services/update';
import express from 'express'

const router = express.Router();

router.get('/douban/:id', findDoubanId);
router.get('/imdb/:id', findIMDBId);
router.get('/search', searchMovie);

router.get('/updateMovies', updateMovies);
router.get('/updateDetails', updateDetail);

export default router;