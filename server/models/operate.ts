import mongoose from 'mongoose';

export interface OperateType {
  operate: string;
  args: Array<string | number>;
  success?: boolean;
  update: number;
}

const Schema = new mongoose.Schema({
  operate: String,
  args: Array,
  success: Boolean,
  update: Number,
});

export default {
  model: mongoose.model<mongoose.Document & OperateType>('operate', Schema),
  Schema,
};
