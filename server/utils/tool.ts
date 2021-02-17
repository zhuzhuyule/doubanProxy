import { exec } from 'child_process';
import dayjs from 'dayjs';
import mongoose from 'mongoose';
import { DATE_FORMAT } from './constants';
import fs from 'fs';
import gitPull from 'git-pull-or-clone';

export type TypeOmit<T, k> = Pick<T, Exclude<keyof T, k>>;


const ULR_LIST = ['https://movie.douban.com/subject', 'https://movie.douban.com/j/subject_suggest', 'https://movie.douban.com/j/search_subjects', 'https://movie.douban.com/j/new_search_subjects', 'https://movie.douban.com/j/chart/top_list'];
function getUrlIdentity(url: string): string {
  return ((ULR_LIST.find(identity => url.startsWith(identity)) || '').match(/([\w_]+)$/) || [''])[0];
}

async function updateTable<T>(query: any, document: any, model: mongoose.Model<mongoose.Document & T>): Promise<T | null> {
  const options = { upsert: true, new: true, setDefaultsOnInsert: true };
  return await model.findOneAndUpdate(query, document, options);
}

// size: 's' | 'n'
// eg link: https://img3.doubanio.com/view/photo/n_ratio_poster/public/p451885601.jpg
function getCoverLink(id: number | string, size = 's'): string {
  return `https://img3.doubanio.com/view/photo/${size}_ratio_poster/public/${id}.jpg`
}

function getCoverImageId(link = ''): string {
  return match(link, /\/([^./\\]+)\.(webp|jpg|png)$/, 1);
}

function match(text = '', reg: RegExp, index = 0): string {
  const matchs = text.match(reg);
  return (matchs && matchs.length > index) ? matchs[index] : '';
}

const transferTime = (date?: number | string | null | dayjs.Dayjs): number => {
  const time = dayjs(date || undefined);
  return time.isValid() ? parseInt(time.format(DATE_FORMAT.shortInt), 10) : 0;
}

const getDateTime = (date?: string | number): string => {
  if (date) {
    return `${date}`.length === 12 ? `${date}`.replace(/(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)(\d\d)/, '20$1-$2-$3 $4:$5:$6') : dayjs(date).format(DATE_FORMAT.standard);
  }
  return '';
}

const getRealLength = (str: string): number => {
  // eslint-disable-next-line no-control-regex
  return str.replace(/[^\x00-\xff]/g, '__').length;
}

const calcProcess = (current = 0, total = 1): string => {
  if (total < 1) {
    return ''
  }
  return `${(current / total * 100).toFixed(2)}%`
}

const promiseWithTimeout = <T>(time: number, promise: Promise<T>): Promise<T | 'timeout'> => {
  let handle;
  const timePromise = new Promise<'timeout'>(reslove => {
    handle = setTimeout(() => {
      reslove('timeout');
    }, time)
  })

  return Promise.race<Promise<T | 'timeout'>>([promise, timePromise]).then(result => {
    clearTimeout(handle);
    return result;
  })
}

const backupProgram = (): void => {
  exec(`cp -rf package.json _backup/ && cp -rf server _backup/`);
};

const updateProgram = (folder = 'temp'): void => {
  const packageContent = fs.readFileSync('package.json');
  const packageJson = JSON.parse(packageContent.toString());

  const newPackageContent = fs.readFileSync(`./${folder}/package.json`);
  const newPackageJson = JSON.parse(newPackageContent.toString());

  const packageUpdate = JSON.stringify(packageJson.dependencies) !== JSON.stringify(newPackageJson.dependencies);
  exec(`cp ${folder}/package.json package.json && ${packageUpdate ? 'yarn &&' : ''} cp -rf ${folder}/server . && rm -rf ${folder}`);
};

const pullCode = (): void => {
  backupProgram();
  try {
    gitPull('https://github.com/zhuzhuyule/doubanProxy.git', './temp', () => {
      try {
        updateProgram('temp');
      } catch {
        updateProgram('_backup');
      }
    });
  } catch {
    updateProgram('_backup');
  }
}

export {
  updateProgram,
  pullCode,
  updateTable,
  getCoverLink,
  getCoverImageId,
  match,
  getDateTime,
  transferTime,
  promiseWithTimeout,
  similarity,
  calcProcess,
  getUrlIdentity,
  getRealLength,
}

function similarity(str1: string, str2: string): number {
  const len1 = str1.length;
  const len2 = str2.length;
  const diff = new Array(len1 + 1);

  let i, j;
  for (i = 0; i < len1 + 1; i++) {
    diff[i] = new Array(len2 + 1);
    diff[i][0] = i;
  }
  for (i = 0; i < len2 + 1; i++) {
    diff[0][i] = i;
  }

  let temp;
  for (i = 1; i <= len1; i++) {
    for (j = 1; j <= len2; j++) {
      if (str1[i - 1] == str2[j - 1]) {
        temp = 0;
      } else {
        temp = 1;
      }
      const temp1 = diff[i - 1][j - 1] + temp;
      const temp2 = diff[i][j - 1] + 1;
      const temp3 = diff[i - 1][j] + 1;

      diff[i][j] = [temp1, temp2, temp3].reduce(
        (min, num) => (num > min ? min : num),
        1000
      );
    }
  }
  return 1 - diff[len1][len2] / Math.max(len1, len2);
}
