import mongoose from 'mongoose';

export interface MovieType {
  id: number,
  title?: string,
  year?: number,
  alias?: string,
  actor?: string,
  type?: string,
  region?: string,
  date?: string,
  time?: string,
  IMDb?: string,
  ratingPeople?: number,
  betterThan?: string,
  rating?: number,
}

const Schema = new mongoose.Schema({
  id: {
    type: Number,
    required: true
  },
  title: String,
  year: Number,
  alias: String,
  actor: String,
  type: String,
  region: String,
  date: String,
  time: String,
  IMDb: String,
  ratingPeople: Number,
  betterThan: String,
  rating: Number,
});

Schema.index({ id: 1 });

export default {
  model: mongoose.model('Movie', Schema),
  Schema
};