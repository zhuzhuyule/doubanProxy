import dynamicMovieCtrl from '@controllers/dynamicMovie.controller';
import { Request, Response } from 'express';
import proxy from './proxy';
import { updateAll, updateDynamicMovies } from './spider';

export async function updateProxies(_: Request, res: Response): Promise<void> {
  await proxy.getAll();
  res.send('Running get all command!')
}

export function updateMovies(req: Request<{ mode: 'tag' | 'type' }>, res: Response): void  {
  updateDynamicMovies(req.params.mode);
  res.send('Running get all command!')
}

export async function updateDetail(_: Request<{ mode: 'tag' | 'type' }>, res: Response): Promise<void>  {
  const ids = await dynamicMovieCtrl.findAll();
  res.send('Running get all command!'+ ids.length );
  updateAll();
}