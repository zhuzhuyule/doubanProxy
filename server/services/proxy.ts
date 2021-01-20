import proxyCtl from '@controllers/proxy.controller';
import { ProxyType } from '@models/proxy.model';
import { DATE_FORMAT } from '@utils/constants';
import tool from '@utils/tool';
import axios from 'axios-https-proxy-fix';
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
      const validAgents = await proxyCtl.getValidProxies(this.type) || [];
      this.pool.concat(validAgents.map(agent => agent?.proxy || ''));
    }
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
    return await this.hookGet().then(async proxy => {
      if (proxy) {
        await proxyCtl.updateUseCount(proxy || '');
      }
      return proxy;
    })
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
      return this.proxy;
    }
    this.printHistory();
    return '';
  }

  getProxy = () => {
    return Promise.resolve({
      ip: '',
      port: '',
      type: 'free',
    });
  }
}

class SunProxy extends Proxy {
  constructor() {
    super();
    this.type = 'sun';
  }
  getAll = async () => {
    this.pool = [];
    for (let i = 0, done = false; i < 50 && !done; i++) {
      await this.getProxy().then(this.checkProxy).then(item => done = !item);
    }
    tool.log.split('-');
    console.log(`Get all sun proxy finished`);
  }

  getProxy = () => {
    return axios.get('http://http.tiqu.alibabaapi.com/getip?num=1&type=2&pack=62031&port=1&ts=1&lb=1&pb=4&regions=').then(res => {
      if (res.data.code === 121) {
        return null;
      }
      const agent = res.data.data[0];
      return agent && {
        ip: agent.ip,
        port: agent.port,
        expire_time: parseInt(dayjs(agent.expire_time).format(DATE_FORMAT.shortInt), 10),
        type: this.type,
      };
    }).catch(e => {
      console.error(e);
      return null;
    });
  }
}

class FreeProxy extends Proxy {
  constructor() {
    super();
    this.type = 'free';
  }
  getProxy = async () => {
    return await axios.get('http://127.0.0.1:5010/get').then(res => {
      if (!res.data.proxy) {
        console.warn(`The free proxy pool is empty, Please retry later!`);
        console.log(`Remaining Proxy Status：http://127.0.0.1:5010/get_status/`);
        console.log(`Showing All Free Proxy：http://127.0.0.1:5010/get_all/`);
      }
      return res.data.proxy ? {
        ip: res.data.proxy.split(':')[0],
        port: res.data.proxy.split(':')[1],
        type: this.type,
      } : {
          ip: '',
          port: '',
          type: this.type,
        };
    }).catch(e => {
      console.error(e);
      return {
        ip: '',
        port: '',
        type: this.type,
      };
    });
  }

  count = () => {
    axios.get('http://127.0.0.1:5010/get_status').then(res => console.info(`There is ${res.data.count} free proxy!`));
  }

  delete = async () => {
    const proxy = this.proxy;
    this.proxy = '';
    await this.updateInvalidTime(proxy);
    await axios.get('http://127.0.0.1:5010/delete', { params: { proxy } }).then(this.count)
    return '';
  }
}

export default new class Agent {
  private freeProxy: Proxy;
  private sunProxy: Proxy;
  private isFree: boolean;
  constructor() {
    this.freeProxy = new FreeProxy();
    this.sunProxy = new SunProxy();
    this.isFree = false;
  }

  getAll = () => {
    this.sunProxy.getAll();
  }

  get = () => {
    return this.sunProxy.get().then(proxy => {
      if (proxy) {
        return proxy
      }
      this.isFree = true;
      return this.freeProxy.get()
    })
  }

  delete = () => {
    if (this.isFree) {
      return this.freeProxy.delete();
    }
    return this.sunProxy.delete();
  }
}
