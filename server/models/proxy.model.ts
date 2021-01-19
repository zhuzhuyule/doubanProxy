import mongoose from 'mongoose';

export interface ProxyType {
  ip: string;
  port: string;
  type: string;
  expire_time?: number,
  useCount?: number,
  invalidTime?: number,
}

const Schema = new mongoose.Schema({
  ip: String,
  port: String,
  type: String,
  expire_time: Number,
  useCount: Number,
  invalidTime: Number,
});

export default {
  model: mongoose.model<mongoose.Document & ProxyType>('proxy', Schema),
  Schema,
};
