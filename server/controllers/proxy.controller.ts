import Proxy, { ProxyType } from '@models/proxy.model';
import { DATE_FORMAT } from '@utils/constants';
import tool from '@utils/tool';
import dayjs from 'dayjs';

async function insert (agent: ProxyType): Promise<void | ProxyType | null> {
  return await tool.updateTable(
     { ip: agent.ip, port: agent.port },
     { ...agent, expire_time: tool.transferTime(agent.useCount), useCount: 0, invalidTime: 0 },
      Proxy.model
    )
    .catch(e => console.log(e));
}

async function update (proxy: string, doc = {}, inc = {}) {
  const agent = { ip: proxy.split(':')[0], port: proxy.split(':')[1] };
  return await Proxy.model.updateOne({ ip: agent.ip, port: agent.port }, {
    $set: doc,
    $inc: inc
  }).catch((e: unknown) => console.log(e));
}

async function updateUseCount (proxy: string): Promise<{_: string}> {
  return await update(proxy, {}, { useCount: 1 });
}

async function updateInvalidTime (proxy: string): Promise<{_: string}> {
  const time = parseInt(dayjs().format(DATE_FORMAT.standard), 10);
  return await update(proxy, { invalidTime: time });
}

async function getValidProxies(type = 'sun', count  = 10) {
  return await Proxy.model.find({ type, invalidTime: 0 })
    .sort({ expire_time: 1 })
    .limit(count)
    .then(agents => agents?.map(formatProxy))
    .catch(e => {
      console.log(e);
      return null;
    })
}

async function getProxies({ type = 'free', top = 10, hour = 0, min = 0, baseDate = '' }) {
  const time = parseInt(dayjs(baseDate || undefined).hour(-hour).minute(-min).format(DATE_FORMAT.standard), 10);
  return await Proxy.model.find({ type, expire_time: { $gt: time }})
    .sort({ _id: -1 })
    .limit(top)
    .sort({ id: 1 })
    .then(agents => agents?.map(formatProxy))
    .catch(e => {
      console.log(e);
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
      expire_time: tool.getDateTime(agent.expire_time),
      invalidTime: tool.getDateTime(agent.invalidTime),
    }
} 

export default {
  insert,
  updateInvalidTime,
  updateUseCount,
  getProxies,
  getValidProxies,
};
