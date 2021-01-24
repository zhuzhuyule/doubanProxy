import config from '@configs/config';
import proxyCtl from '@controllers/proxy.controller';
import { ProxyType } from '@models/proxy.model';
import { DATE_FORMAT } from '@utils/constants';
import tool from '@utils/tool';
import axios from 'axios-https-proxy-fix';
import cheerio from 'cheerio';
import dayjs from 'dayjs';
class Proxy {
  pool: string[]
  maxCount: number;
  proxy?: string;
  history: string[];
  type: 'free' | 'sun';

  constructor() {
    this.maxCount = 10000;
    this.pool = [];
    this.proxy = '';
    this.type = 'free';
    this.history = ([] as string[]).concat(this.pool);
  }
  initialProxyPool = async () => {
    if (!this.pool.length) {
      try {
        const validAgents = await proxyCtl.getValidProxies(this.type) || [];
        this.pool = validAgents.map(agent => agent?.proxy || '');
      } catch (error) {
        console.error(error);
      }
    }
  }

  autoLogin = () => {
    return Promise.resolve('');
  }

  count = () => {
    return Promise.resolve('');
  }

  hookGet = async (isRetry = false): Promise<string> => {
    isRetry && console.warn(`Try get proxy again!`);
    await this.initialProxyPool();

    if (this.proxy) {
      console.log(`Get old proxy: "${this.proxy}"`);
      return await Promise.resolve(this.proxy || '')
    }
    if (this.pool.length > 0) {
      this.proxy = this.pool.shift();
      console.log(`Get new proxy from the pool: "${this.proxy}"`);
      return await Promise.resolve(this.proxy || '')
    }
    if (this.history.length > this.maxCount) {
      console.warn(`Already used below ${this.maxCount} proxies`);
      this.printHistory();
      return await Promise.resolve('')
    }
    return await this.getProxy()
      .then(async agent => await this.checkProxy(agent))
      .then(async proxy => (proxy || isRetry) ? proxy : await this.hookGet(true));
  }

  get = async () => {
    const proxy = await this.hookGet()
    if (proxy) {
      await proxyCtl.updateUseCount(proxy || '');
    }
    return proxy;
  }

  getAll = async () => {
    return Promise.resolve();
  }

  updateInvalidTime = (proxy?: string) => {
    proxyCtl.updateInvalidTime(proxy || '');
  }

  delete = async () => {
    await this.updateInvalidTime(this.proxy);
    this.proxy = '';
    return '';
  }

  printHistory = () => {
    console.log('-------------------------------------------------------------------------------------------------------');
    console.log(`| History prox:`);
    this.history.map((proxy, index) =>
      console.log(`| [${index + 1}]  ${proxy} | curl -x "${proxy}" "https://movie.douban.com/subject/1306388/"`));
    console.log('-------------------------------------------------------------------------------------------------------');
  }

  checkProxy = async (agent?: ProxyType | null) => {
    if (agent) {
      this.proxy = `${agent.ip}:${agent.port}`;
      this.history.push(this.proxy);
      console.log(`Get New Proxy: "${this.proxy}"!`);
      this.printHistory();
      await proxyCtl.insert(agent);
      console.log(`Have saved Proxy: "${this.proxy}"!`);
      return this.proxy;
    }
    console.error('empty', agent);
    this.printHistory();
    return '';
  }

  getProxy = (): Promise<any> => {
    return Promise.resolve(null);
  }
}

class SunProxy extends Proxy {
  private token: string;
  constructor() {
    super();
    this.type = 'sun';
    this.token = config.proxy.defaultToken;
  }

  autoLogin = async () => {
    console.log('Start login...');
    const res = await axios.get<{ code: string; ret_data: string; msg: string }>('http://ty-http-d.hamir.net/index/login/dologin', {
      params: {
        phone: config.proxy.phone,
        password: config.proxy.password
      }
    });
    console.log('Login sun proxy account, get message:', res.data.msg);
    if (res.data.code == '1') {
      this.token = res.data.ret_data;
    }
    return this.token;
  }

  requestFreeProxy = async (isSecond = false) => {
    const res = await axios.get<{ code: string; msg: string }>('http://ty-http-d.hamir.net/index/users/get_day_free_pack', {
      params: {
        'session-id': this.token
      }
    })
    console.log('Get free proxy of everyday request, get message:',res.data.msg);
    if (res.data.code == '1') {
      return '';
    } else if (isSecond) {
      await this.autoLogin();
      return this.requestFreeProxy(true);
    }
    console.error('Get free proxy failed!');
    return '';
  }

  count = async (isSecond = false) => {
    const res = await axios.get<{ code: string; msg: string; ret_data: { list: string } }>('http://ty-http-d.hamir.net/index/api/get_package', {
      params: {
        'session-id': this.token
      }
    })
    if (res.data.code == '1') {
      const $ = cheerio.load(res.data.ret_data.list || '');
      console.log($('li').text);
      return $('span:second').text();
    } else if (isSecond) {
      await this.autoLogin();
      return this.count(true);
    }
    console.error('Get count failed!');
    return '';
  }

  getAll = async () => {
    this.pool = [];
    for (let i = 0, done = false; i < 50 && !done; i++) {
      const agent = await this.getProxy();
      const proxy = await this.checkProxy(agent);
      if (!proxy) {
        done = true;
      }
    }
    tool.log.split('-');
    console.log(`Get all sun proxy finished`);
  }

  generateAgent = (agent: any) => {
    return agent && {
      ip: agent.ip,
      port: agent.port,
      expire_time: parseInt(dayjs(agent.expire_time).format(DATE_FORMAT.shortInt), 10),
      type: this.type,
    }
  }

  addWhitelist = async (ip: string) => {
    try {
      const res = await axios.get<{ code: string; success: string }>(`${config.proxy.whitelistUrl}${ip}`)
      return res.data.success;
    } catch (error) {
      console.error(error);
      return null;
    }
  }

  getProxy = async (isRetry = false) => {
    const res = await axios.get<{ code: number; message: string; data: ProxyType[]}>(`http://http.tiqu.alibabaapi.com/getip?num=1&type=2&pack=${config.proxy.packageNum}&port=1&ts=1&lb=1&pb=4&regions=`)
    console.log('get proxy', res?.data?.data);
    // 121 out of ip count
    if (res.data.code === 121) {
      return null;
    }
    // 113  the ip address is no premission
    if (res.data.code === 113 && !isRetry) {
      const matchContents = (res.data.message || '').match(/\d+\.\d+\.\d+/)
      const ip = matchContents && matchContents[0] || '';
      const isSuccess = await this.addWhitelist(ip); 
      if (isSuccess) {
        return await this.getProxy(true);
      }
    }
    return this.generateAgent(res.data.data[0]);
  }
}

class FreeProxy extends Proxy {
  constructor() {
    super();
    this.type = 'free';
  }

  getProxy = async () => {
    const res = await axios.get<{ proxy: string }>(`${config.freeProxy.baseUrl}/get`)
    if (!res.data.proxy) {
      console.warn(`The free proxy pool is empty, Please retry later!`);
      console.log(`Remaining Proxy Status：${config.freeProxy.baseUrl}/get_status/`);
      console.log(`Showing All Free Proxy：${config.freeProxy.baseUrl}/get_all/`);
      return null;
    }
    return {
      ip: res.data.proxy.split(':')[0],
      port: res.data.proxy.split(':')[1],
      type: this.type,
    }
  }

  count = async () => {
    const res = await axios.get<{ count }>(`${config.freeProxy.baseUrl}/get_status`);
    console.info(`There is ${res.data.count} free proxy!`);
    return res.data.count
  }

  delete = async () => {
    const proxy = this.proxy;
    this.proxy = '';
    await this.updateInvalidTime(proxy);
    await axios.get(`${config.freeProxy.baseUrl}/delete`, { params: { proxy } })
    await this.count();
    return '';
  }
}

export default new class Agent {
  private proxy: Proxy;
  constructor() {
    this.proxy = new SunProxy();
  }

  getAll = () => {
    return this.proxy.getAll().catch(e => {
      console.error(e);
    });
  }

  getCount = () => {
    return this.proxy.count().catch(e => {
      console.error(e);
      return ''
    });
  }

  get = async () => {
    try {
      const proxy = await this.proxy.get();
      if (proxy) {
        return proxy
      }
      if (this.proxy.type === 'sun') {
        this.proxy = new FreeProxy();
        return await this.proxy.get()
      }
      return '';
    } catch (error) {
      console.error(error);
      return '';
    }
  }

  delete = () => {
    return this.proxy.delete().catch(e => {
      console.error(e);
      return ''
    });
  }
}
