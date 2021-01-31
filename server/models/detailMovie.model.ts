import mongoose from 'mongoose';

export interface DetailMovieType {
  id: number | string,
  imdb?: string,
  coverId?: string,
  rating: string | number,
  voteCount?: number,
  title: string[],
  alias?: string[],
  time?: string,
  date?: string,
  actors?: string[],
  tags?: string[],
  types?: string[],
  betterThan?: string[],
  regions?: string[],
  update?: number,
  notFound?: boolean,
}

const Schema = new mongoose.Schema({
  id: Number,
  imdb: String,
  coverId: String,
  rating: Number,
  voteCount: Number,
  title: Array(String),
  alias: Array(String),
  time: String,
  date: String,
  actors: Array(String),
  tags: Array(String),
  types: Array(String),
  betterThan: Array(String),
  regions: Array(String),
  update: Number,
  notFound: Boolean,
});

export default {
  model: mongoose.model<mongoose.Document & DetailMovieType>('detailMovie', Schema),
  Schema,
};
