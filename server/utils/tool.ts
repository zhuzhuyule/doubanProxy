import mongoose from 'mongoose';

async function updateTable(query: any, document: any, model: mongoose.Model<mongoose.Document<any>>): Promise<unknown> {
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

const log = {
  split: (sign = '*') => console.log(`[${new Date().toTimeString().slice(0, 8)}]` + `${sign}`.repeat(120 / `${sign}`.length)),
}

export default {
  updateTable,
  douban: {
    getCoverLink,
    getCoverImageId,
  },
  match,
  log,
}
