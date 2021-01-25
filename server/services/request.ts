import { MovieType } from '@models/movie.model';
import axios, { AxiosRequestConfig } from 'axios-https-proxy-fix';
import tool from '@utils/tool';
import proxy from './proxy';
import cheerio from 'cheerio';
import { DynamicMovieType } from '@models/dynamicMovie.model';


const NUMBER_OF_RETRY = 4;
const MAX_RETRY = 600;
const retryCounter: { [_ in string]: number } = {};
async function request(url: string, options?: AxiosRequestConfig , retryCount = 1): Promise<any>  {
  if (retryCount > 1) {
    console.log('     ↓');
    console.log(`Totally retry [${retryCount - 1}] times!`);
  }
  const params = options && options.params;
  console.log(`Request URL: ${url}${params ? '?' + JSON.stringify(params).replace(/[{}"]/g, '').replace(/:/g, '=').replace(/,/g, '&') : ''}`);
  const [host, port] = (await proxy.get()).split(':');
  retryCounter[host] = (retryCounter[host] || 0) + 1;
  retryCounter[host] > 1 && console.info(`Use the proxy: "${host}:${port}" retry [${retryCounter[host] - 1}] times`);
  return axios.get(url, {
    // proxy: { host, port: parseInt(port) },
    timeout: 7000 + (retryCounter[host] - 1) * 1000,
    ...options
  })
    .then(response => {
      if (response && [404].indexOf(response.status) > -1) {
        console.error(`Not Found Page:`, response.status, `${url}${params ? '?' + JSON.stringify(params).replace(/[{}"]/g, '').replace(/:/g, '=').replace(/,/g, '&') : ''}`);
        return { status: response.status, message: 'Not Found Page' }
      }
      if (response.status === 200 && response.data && response.data.status !== undefined || (response.data.toString().indexOf('<script>var d=[navigator.platform') === 0)) {
        console.error(`Use Proxy: ${host}:${port}`);
        console.error(`Response Data: ${JSON.stringify(response.data)}`);
        throw { status: '500', message: JSON.stringify(response.data) };
      } else {
        delete retryCounter[host];
        return response;
      }
    })
    .catch(async e => {
      if (e.response && [404].indexOf(e.response.status) > -1) {
        console.error(`Not Found Page:`, e.response.status, `${url}${params ? '?' + JSON.stringify(params).replace(/[{}"]/g, '').replace(/:/g, '=').replace(/,/g, '&') : ''}`);
        return { status: e.response.status, message: 'Not Found Page' }
      }
      console.error(`Use Proxy: ${host}:${port}`);
      if (e.code || (e.response && e.response.status)) {
        console.error(`Error Code: ${e.code || (e.response && e.response.status)}`, e.message || '');
      } else {
        console.error(e);
      }
      if (retryCounter[host] === NUMBER_OF_RETRY) {
        await proxy.delete();
        delete retryCounter[host];
      }
      if (retryCount === (MAX_RETRY + 1)) {
        console.error(`The maximum number of proxy requests exceeded`);
        throw { status: 500, message: 'The maximum number of proxy requests exceeded' }
      }
      return await request(url, options, retryCount + 1);
    });
}

/**
 * Search movie by freetext
 * @param {string} movieName
 */
export async function searchMovies(movieName: string): Promise<string[]> {
  if (movieName) {
    return [];
  }
  return await request(`https://movie.douban.com/j/subject_suggest?q=${encodeURIComponent(movieName)}`)
    .then(response => {
      if (response.status === 200 && response.data) {
        console.log(`Success: Search '${movieName}' gets ${response.data.length} movie${response.data.length > 1 ? 's' : ''}`);
        return (response.data as [{ id: string }]).map(item => item.id)
      }
      console.error(`Failed! Search ${movieName} movie failed！| error status: ${response.status} ${response.statusText || response.message}`,);
      return [];
    })
}

const MOVIE_TYPES = { '剧情': '11', '喜剧': '24', '动作': '5', '爱情': '13', '科幻': '17', '动画': '25', '悬疑': '10', '惊悚': '19', '恐怖': '20', '纪录片': '1', '短片': '23', '情色': '6', '同性': '26', '音乐': '14', '歌舞': '7', '家庭': '28', '儿童': '8', '传记': '2', '历史': '4', '战争': '22', '犯罪': '3', '西部': '27', '奇幻': '16', '冒险': '15', '灾难': '12', '武侠': '29', '古装': '30', '运动': '18', '黑色电影': '31' };
const RATING_RANGE = ['100:90', '90:80', '80:70', '70:60', '60:50', '50:40', '40:30', '30:20', '20:10', '10:0'];
/**
 * Search the movie list by movie type(alias: type ranking)
 * @param {string} type enum: 剧情 | 喜剧 | 动作 | 爱情 | 科幻 | 动画 | 悬疑 | 惊悚 | 恐怖 | 纪录片 | 短片 | 情色 | 同性 | 音乐 | 歌舞 | 家庭 | 儿童 | 传记 | 历史 | 战争 | 犯罪 | 西部 | 奇幻 | 冒险 | 灾难 | 武侠 | 古装 | 运动 | 黑色电影
 * default: 科幻
 * @param {number} rangeLevel enum: 1 ~ 10  the same type movie ranking level1 ~ level10    default: 1
 * @param {number} page default: 1
 * @param {number} pageCount default: 800 (max 500)
 */
export async function searchMoviesByType(type: keyof typeof MOVIE_TYPES, rangeLevel = 0, page = 1, pageCount = 800): Promise<[DynamicMovieType & { score: string }]> {
  return await request('https://movie.douban.com/j/chart/top_list', {
    params: {
      type: MOVIE_TYPES[type] || 17,
      interval_id: RATING_RANGE[rangeLevel] || RATING_RANGE[0],
      action: '',
      start: (page - 1) * pageCount,
      limit: pageCount,
    },
    timeout: 30000,
  })
    .then(response => {
      if (response.status === 200 && response.data) {
        console.log(`Success: 总计获取"${type}"电影"${response.data.length}"部！`);
        return response.data.map(item => item);
      }
      console.error(`Failed! Gets '${type}' tag movie failed！| error status: ${response.status} ${response.statusText || response.message}`,);
      return [];
    })
}
// response.data = {
//   actor_count: 25
//   actors: ["杰米·福克斯", "蒂娜·菲", "菲利西亚·拉斯海德", "阿米尔-卡利布·汤普森", "戴维德·迪格斯", "格拉汉姆·诺顿", "瑞切尔·豪斯", "艾莉丝·布拉加", "理查德·艾欧阿德",…]
//   cover_url: "https://img9.doubanio.com/view/photo/s_ratio_poster/public/p2626308994.jpg"
//   id: "24733428"
//   is_playable: false
//   is_watched: false
//   rank: 45
//   rating: ["8.9", "45"]
//   regions: ["美国"]
//   release_date: "2020-12-25"
//   score: "8.9"
//   title: "心灵奇旅"
//   types: ["动画", "奇幻", "音乐"]
//   url: "https://movie.douban.com/subject/24733428/"
//   vote_count: 447666
// }

/**
 * Search the movie list by tag
 * @param {string} tag enum: 热门 | 最新 | 经典 | 可播放 | 豆瓣高分 | 冷门佳片 | 华语 | 欧美 | 韩国 | 日本 | 动作 | 喜剧 | 爱情 | 科幻 | 悬疑 | 恐怖 | 文艺
 * default: 热门
 * @param {string} sort enum: recommend | time | rank      default: time
 * @param {number} page default: 1
 * @param {number} pageCount default: 500 (max 500)
 */
export async function searchMoviesByTag(tag = '热门', sort = 'time', page = 1, pageCount = 800): Promise<DynamicMovieType[]> {
  return await request(`https://movie.douban.com/j/search_subjects`, {
    params: {
      type: 'movie',
      tag: encodeURIComponent(tag),
      sort,
      page_limit: pageCount,
      page_start: (page - 1) * pageCount
    },
    // timeout: 20000,
  })
    .then(response => {
      if (response.status === 200 && response.data && response.data.subjects) {
        console.log(`Success: 总计获取"${tag}"电影"${response.data.subjects.length}"部！`);
        return response.data.subjects.map(item => item);
      }
      console.error(`Failed! Gets '${tag}' tag movie failed！| error status: ${response.status} ${response.statusText || response.message}`,);
      return [];
    })
}
// response.data.subjects {
//   cover: "https://img9.doubanio.com/view/photo/s_ratio_poster/public/p2626308994.jpg"
//   cover_x: 6611
//   cover_y: 9435
//   id: "24733428"
//   is_new: false
//   playable: false
//   rate: "8.9"
//   title: "心灵奇旅"
//   url: "https://movie.douban.com/subject/24733428/"
// }

/**
 * Search the movie by movie id
 * @param {number} movieId
 */
export async function searchMovie(movieId: string): Promise<MovieType | null> {
  return await request(`https://movie.douban.com/subject/${movieId}/`)
    .then(response => {
      if ([404].indexOf(response.status) > -1) {
        return {
          id: parseInt(movieId, 10),
          notFound: true,
        }
      }

      if (response.status === 200 && response.data && response.data.status === undefined) {
        const $ = cheerio.load(response.data);
        const info = $('#info').text().replace(/[ \t]/g, '');
        const title = $('h1').find('span:first').text().trim();
        if (info && title) {
          const $subject = $('.subjectwrap');
          const card = {
            id: parseInt(movieId, 10),
            title,
            coverId: tool.douban.getCoverImageId($subject.find('#mainpic img').attr('src')),
            year: parseInt($('h1').find('.year').text().trim().replace(/\(|\)/g, '') || '1999', 10),
            alias: tool.match(info, /又名:([^\n]*)/, 1),
            actor: tool.match(info, /主演:([^\n]*)/, 1),
            type: tool.match(info, /类型:([^\n]*)/, 1),
            region: tool.match(info, /地区:([^\n]*)/, 1),
            date: tool.match(info, /日期:([^\n]*)/, 1),
            time: tool.match(info, /片长:([^\n]*)/, 1),
            IMDb: tool.match(info, /IMDb链接:([^\n]*)/, 1),
            ratingPeople: parseInt($subject.find('.rating_people').text().trim().replace('人评价', ''), 10) || 0,
            betterThan: $subject.find('.rating_betterthan').text().replace(/ |\t|\n/g, '').replace(/好于/g, ' '),
            rating: parseInt($subject.find('.rating_num').text().trim(), 10) || 0,
            notFound: false,
          }
          return card;
        } else {
          console.log('解析文档出现问题, 资源内容如下：');
          console.log(response.data);
        }
      }
      console.error(`Failed! Get id:${movieId} movie failed！| error status: ${response.status} ${response.statusText || response.message}`,);
      return null;
    });
}

// searchMovie(30346025);