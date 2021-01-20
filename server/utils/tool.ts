import dayjs from 'dayjs';
import mongoose from 'mongoose';
import { DATE_FORMAT } from './constants';

export type TypeOmit<T, k> = Pick<T, Exclude<keyof T, k>>;

async function updateTable<T>(query: any, document: any, model: mongoose.Model<mongoose.Document & T>): Promise<T | null> {
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };
  return await model.findOneAndUpdate(query, document, options);
}

// size: 's' | 'n'
// eg link: https://img3.doubanio.com/view/photo/n_ratio_poster/public/p451885601.jpg
function getCoverLink(id: number, size = 's'): string {
  return `https://img3.doubanio.com/view/photo/${size}_ratio_poster/public/${id}.jpg`
}

function getCoverImageId(link = ''): string {
  return match(link, /\/([^./\\]+)\.(webp|jpg|png)$/, 1);
}

function match(text = '', reg: RegExp, index = 0): string {
  const matchs = text.match(reg);
  return (matchs && matchs.length > index) ? matchs[index] : '';
}

const transferTime = (date?: number | string | null): number => {
  const time = dayjs(date || '');
  return time.isValid() ? 0 : parseInt(time.format(DATE_FORMAT.shortInt), 10);
}

const getDateTime = (date?: string | number): string => {
  if (date) {
    return `${date}`.length === 12 ? `${date}`.replace(/(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)/,'20$1-$2-$3 $4:$5:$6') : dayjs(date).format(DATE_FORMAT.standard);
  }
  return '';
}


const log = {
  split: (sign = '*'): void => console.log(`[${new Date().toTimeString().slice(0, 8)}]` + `${sign}`.repeat(120 / `${sign}`.length)),
}

export default {
  updateTable,
  douban: {
    getCoverLink,
    getCoverImageId,
  },
  match,
  getDateTime,
  transferTime,
  log,
}
