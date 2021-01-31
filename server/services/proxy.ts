import config from '@configs/config';
import proxyCtl from '@controllers/proxy.controller';
import { ProxyType } from '@models/proxy.model';
import { DATE_FORMAT, INVALID_PROXY } from '@utils/constants';
import { promiseWithTimeout } from '@utils/tool';
import axios from 'axios-https-proxy-fix';
import cheerio from 'cheerio';
import dayjs from 'dayjs';
import logSymbol from 'log-symbols';
import { getLogger } from 'log4js';
const logger = getLogger('proxy');

class Proxy {
  pool: string[]
  maxCount: number;
  proxy?: string;
  history: string[];
  type: 'free' | 'sun';
  retryCount: number;

  constructor() {
    this.maxCount = 10000;
    this.pool = [];
    this.proxy = '';
    this.type = 'free';
    this.history = ([] as string[]).concat(this.pool);
    this.retryCount = 0;
  }
  initialProxyPool = async () => {
    if (!this.pool.length) {
      try {
        const validAgents = await proxyCtl.getValidProxies(this.type) || [];
        this.pool = validAgents.map(agent => agent?.proxy || '');
      } catch (error) {
        logger.error(logSymbol.error, error);
      }
    }
  }

  autoLogin = () => {
    return Promise.resolve('');
  }

  count = () => {
    return Promise.resolve('');
  }

  verifyProxy = async (proxy?: string) => {
    if (!proxy) {
      this.proxy = '';
      return '';
    }
    const [host, port] = proxy.split(':');
    logger.info(logSymbol.info,`Verify the proxy: ${proxy} | curl "https://movie.douban.com/subject/1306388/" -x "${proxy}"`);
    let cancelRequest;
    const testResponse  = await promiseWithTimeout(20000,
      axios.get('https://www.baidu.com', { 
        cancelToken: new axios.CancelToken(cb => cancelRequest = cb),
        proxy: { host, port: parseInt(port) || 80 },
        timeout: 10000
      }))
      .then(res => {
        if (res === 'timeout') {
          cancelRequest();
          logger.error(logSymbol.error, `Failed`, 403, 'Request time out. [20000]ms');
          return INVALID_PROXY;
        }
        if (res.status > 199 && res.status < 300) {
          return '';
        }
        logger.error(logSymbol.error, `Failed`, res.status, res.statusText);
        return INVALID_PROXY
      })
      .catch(e => {
        logger.error(logSymbol.error, `Failed`, e.code || e.response?.status, e.message || e.response?.statusText);
        return INVALID_PROXY
      });
      if (testResponse === INVALID_PROXY) {
        await this.updateInvalidTime(proxy);
        this.proxy =  '';
      } else {
        logger.info(logSymbol.success, proxy);
        this.proxy = proxy;
      }
    return this.proxy;
  }

  hookGet = async (): Promise<string> => {
    if (this.retryCount > 10) {
      this.retryCount = 0;
      return '';
    }
    if (!this.proxy) {
      this.retryCount = this.retryCount + 1;
      this.retryCount > 1 && logger.warn(`Try get proxy again![${this.retryCount-1}]`);
    }
    
    await this.initialProxyPool();

    if (this.proxy) {
      logger.info(`Use old proxy: "${this.proxy}"`);
      this.retryCount = 0;
      return this.proxy;
    }
    if (this.pool.length > 0) {
      const proxy = this.pool.shift();
      logger.info(`Use new proxy from the pool: "${proxy}"`);
      await this.verifyProxy(proxy);
      if (this.proxy) {
        this.retryCount = 0;
        return this.proxy;
      } else {
        return await this.hookGet();
      }
    }
    if (this.history.length > this.maxCount) {
      logger.warn(logSymbol.warning, `Already used below ${this.maxCount} proxies`);
      this.printHistory();
      this.retryCount = 0;
      return ''
    }
    return await this.getProxy()
      .then(async agent => await this.checkProxy(agent))
      .then(async proxy => proxy ? proxy : await this.hookGet());
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
    logger.info('-------------------------------------------------------------------------------------------------------');
    logger.info(`| History prox:`);
    this.history.map((proxy, index) =>
      logger.info(`| [${index + 1}]  ${proxy} | curl "https://movie.douban.com/subject/1306388/" -x "${proxy}"`));
    logger.info('-------------------------------------------------------------------------------------------------------');
  }

  checkProxy = async (agent?: ProxyType | null) => {
    if (agent) {
      const proxy = `${agent.ip}:${agent.port}`;
      this.history.push(proxy);
      logger.info(`Get New Proxy: "${proxy}"!`);
      this.printHistory();
      await proxyCtl.insert(agent);
      logger.info(logSymbol.info, `Have saved Proxy: "${proxy}"!`);
      return await this.verifyProxy(proxy);
    }
    logger.warn(logSymbol.warning, 'empty', agent);
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
    logger.warn('Start login...');
    const res = await axios.get<{ code: string; ret_data: string; msg: string }>('http://ty-http-d.hamir.net/index/login/dologin', {
      params: {
        phone: config.proxy.phone,
        password: config.proxy.password
      }
    });
    logger.info(logSymbol.info, 'Login sun proxy account, get message:', res.data.msg);
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
    logger.info('Get free proxy of everyday request, get message:',res.data.msg);
    if (res.data.code == '1') {
      return 'success';
    } else if (!isSecond) {
      await this.autoLogin();
      return this.requestFreeProxy(true);
    }
    logger.error(logSymbol.error, 'Get free proxy failed!');
    return 'failed';
  }

  count = async (isSecond = false) => {
    const res = await axios.get<{ code: string; msg: string; ret_data: { list: string } }>('http://ty-http-d.hamir.net/index/api/get_package', {
      params: {
        'session-id': this.token
      }
    })
    if (res.data.code == '1') {
      const $ = cheerio.load(res.data.ret_data.list || '');
      logger.info($('li').text);
      return $('span:second').text();
    } else if (isSecond) {
      await this.autoLogin();
      return this.count(true);
    }
    logger.error(logSymbol.error, 'Get count failed!');
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
    logger.info(logSymbol.info, `Get all sun proxy finished`);
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
      logger.error(logSymbol.error, error);
      return null;
    }
  }

  getProxy = async (isRetry = false) => {
    const res = await axios.get<{ code: number; msg: string; data: ProxyType[]}>(`http://http.tiqu.alibabaapi.com/getip?num=1&type=2&pack=${config.proxy.packageNum}&port=1&ts=1&lb=1&pb=4&regions=`)
    // 121 out of ip count
    if (res.data.code === 121) {
      if (!isRetry) {
        const status = await this.requestFreeProxy();
        if (status === 'success') {
          return await this.getProxy(true);
        }
      }
      return null;
    }
    // 113  the ip address is no premission
    if (res.data.code === 113 && !isRetry) {
      const matchContents = (res.data.msg || '').match(/(\d+\.){3}\d+/)
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
    const res = await axios.get<{ proxy: string }>(`${config.freeProxy.baseUrl}/pop`)
    if (!res.data.proxy) {
      logger.warn(logSymbol.warning, `The free proxy pool is empty, Please retry later!`);
      logger.info(`Remaining Proxy Status：${config.freeProxy.baseUrl}/get_status/`);
      logger.info(`Showing All Free Proxy：${config.freeProxy.baseUrl}/get_all/`);
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
    logger.mark(logSymbol.info, `There is ${res.data.count} free proxy!`);
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
    // this.proxy = new SunProxy();
    this.proxy = new FreeProxy();
  }

  getAll = () => {
    return this.proxy.getAll().catch(e => {
      logger.error(logSymbol.error, e);
    });
  }

  getCount = () => {
    return this.proxy.count().catch(e => {
      logger.error(logSymbol.error, e);
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
      logger.error(logSymbol.error, error);
      return '';
    }
  }

  delete = () => {
    return this.proxy.delete().catch(e => {
      logger.error(logSymbol.error, e);
      return ''
    });
  }
}
