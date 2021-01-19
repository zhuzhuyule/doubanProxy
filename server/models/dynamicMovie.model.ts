import mongoose from 'mongoose';

export interface DynamicMovieType {
  id: number,
  rating: string,
  title: string,
  tags?: [string],
  types?: [string],
  regions?: [string],
  vote_count?: number,
  update?: number,
  notFound?: boolean,
}

const Schema = new mongoose.Schema({
  id: Number,
  rating: String,
  title: String,
  tags: Array,
  types: Array,
  regions: Array,
  vote_count: Number,
  update: Number,
  notFound: Boolean,
});

export default {
  model: mongoose.model('dynamicMovie', Schema),
  Schema,
};
