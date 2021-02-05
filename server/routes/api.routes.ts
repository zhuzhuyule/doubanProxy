import { findDoubanId, findIMDBId, getStatus, searchMovie } from '@services/query';
import { mergeMovie, updateDetail, updateMovies } from '@services/update';
import express from 'express';
import { exec } from 'child_process';

const router = express.Router();

router.get('/douban/:id', findDoubanId);
router.get('/imdb/:id', findIMDBId);
router.get('/search', searchMovie);
router.get('/status', getStatus);

router.get('/updateMovies', updateMovies);
router.get('/updateDetails', updateDetail);
router.get('/mergeMovie', mergeMovie);

router.get('/restart', (_: express.Request, res: express.Response) => {
  exec('touch server/index.ts');
  res.redirect('/api/')
});


router.get('/', (_: express.Request, res: express.Response) => {
  res.send(`
  <html>
  <head></head>
  <body>
    <ul>
      <li><a target="blank" href="/api/douban/1432146">Search movie id 1432146 ("钢铁侠")</a></li>
      <li><a target="blank" href="/api/imdb/tt0371746">Search movie imdb id tt0371746 ("钢铁侠")</a></li>
    </ul>
    <ul>
      <li><a target="blank" href="/api/search?name=钢铁侠&title=&alias=&id=&imdb=&actor=&year=&all=">Search movie by params:</a>
        <ul>
          <li>title: Fuzzy search is supported</li>
          <li>alias: Fuzzy search is supported</li>
          <li>name: Fuzzy search is supported</li>
          <li>id: Douban movie id</li>
          <li>imdb: IMDb movie id</li>
          <li>actor: Fuzzy search is supported</li>
          <li>year: year</li>
          <li>all: show all(default show top 5)</li>
        </ul>
      
      </li>
    </ul>
    <ul>
      <li><a target="blank" href="/api/status">Current running status</a></li>
    </ul>
    </br>
    <ul>
      <li><a href="/api/updateMovies?mode=type">updateMovies by type</a> [Quickly]</li>
      <li><a href="/api/updateMovies?mode=newTag">updateMovies by new tags</a> [Slowly]</li>
      <li><a href="/api/updateMovies?mode=tag">updateMovies by old tags</a>  [Quickly]</li>
      <li><a href="/api/updateDetails">updateDetails</a> [Slowly]</li>
      <li><a href="/api/mergeMovie">mergeMovie</a> [Quickly]</li>
    </ul>
    <div><a href="/api/restart">Restart Server</a></div>
  </body>
  </html>
  `);

});

export default router;