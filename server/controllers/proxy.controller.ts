import Proxy, { ProxyType } from '@models/proxy.model';
import { DATE_FORMAT } from '@utils/constants';
import { getDateTime, transferTime, updateTable } from '@utils/tool';
import dayjs from 'dayjs';
import { getLogger } from 'log4js';
const logger = getLogger('proxy.controller');

async function insert (agent: ProxyType): Promise<void | ProxyType | null> {
  logger.info('expire_time:', transferTime(agent.expire_time));
  return await updateTable(
     { ip: agent.ip, port: agent.port },
     { ...agent, expire_time: transferTime(agent.expire_time), useCount: 0, invalidTime: 0 },
      Proxy.model
    )
    .catch(e => logger.info(e));
}

async function update (proxy: string, doc = {}, inc = {}) {
  const agent = { ip: proxy.split(':')[0], port: proxy.split(':')[1] };
  return await Proxy.model.updateOne({ ip: agent.ip, port: agent.port }, {
    $set: doc,
    $inc: inc
  }, { upsert: true }).catch((e: unknown) => logger.info(e));
}

async function updateUseCount (proxy: string): Promise<{_: string}> {
  return await update(proxy, {}, { useCount: 1 });
}

async function updateInvalidTime (proxy: string): Promise<{_: string}> {
  const time = parseInt(dayjs().format(DATE_FORMAT.shortInt), 10);
  logger.info(`update ${proxy} InvalidTime:`, time);
  return await update(proxy, { invalidTime: time });
}

async function getValidProxies(type: 'sun' | 'free', count  = 10) {
  return await Proxy.model.find({ type, invalidTime: 0 })
    .sort({ expire_time: 1 })
    .limit(count)
    .then(agents => agents?.map(formatProxy))
    .catch(e => {
      logger.info(e);
      return null;
    })
}

async function getProxies({ type = 'free', top = 10, hour = 0, min = 0, baseDate = '' }) {
  const time = parseInt(dayjs(baseDate || undefined).hour(-hour).minute(-min).format(DATE_FORMAT.shortInt), 10);
  return await Proxy.model.find({ type, expire_time: { $gt: time }})
    .sort({ _id: -1 })
    .limit(top)
    .sort({ id: 1 })
    .then(agents => agents?.map(formatProxy))
    .catch(e => {
      logger.info(e);
      return null;
    })
}

function formatProxy(agent: ProxyType | null) {
    return agent && {
      proxy: `${agent.ip}:${agent.port}`,
      type: agent.type,
      useCount: agent.useCount,
      ip: agent.ip,
      port: agent.port,
      expire_time: getDateTime(agent.expire_time),
      invalidTime: getDateTime(agent.invalidTime),
    }
} 

export default {
  insert,
  updateInvalidTime,
  updateUseCount,
  getProxies,
  getValidProxies,
};
