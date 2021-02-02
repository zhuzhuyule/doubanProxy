import mongoose from 'mongoose';

export interface ProxyType {
  ip: string;
  port: string;
  type: string;
  expire_time?: number,
  useCount?: number,
  invalidOperates?: string[],
}

const Schema = new mongoose.Schema({
  ip: String,
  port: String,
  type: String,
  expire_time: Number,
  useCount: Number,
  invalidOperates: Array(String),
});

export default {
  model: mongoose.model<mongoose.Document & ProxyType>('proxy', Schema),
  Schema,
};
