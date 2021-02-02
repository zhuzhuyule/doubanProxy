import Proxy, { ProxyType } from '@models/proxy';
import { getDateTime, transferTime, updateTable } from '@utils/tool';
import { getLogger } from 'log4js';

const logger = getLogger('proxy.controller');

async function insert(agent: ProxyType): Promise<void | ProxyType | null> {
  return await updateTable(
    { ip: agent.ip, port: agent.port },
    { ip: agent.ip, port: agent.port, expire_time: transferTime(agent.expire_time), useCount: 0, invalidOperates: [] },
    Proxy.model
  )
    .catch(e => logger.error(e));
}

async function update(proxy: string, doc = {}, inc = {}, operate?: string) {
  const agent = { ip: proxy.split(':')[0], port: proxy.split(':')[1] };

  return await Proxy.model.updateOne({ ip: agent.ip, port: agent.port }, {
    $set: {
      ip: agent.ip,
      port: agent.port,
      ...doc,
    },
    $inc: inc,
    $addToSet: {
      ...(operate && { invalidOperates: { $each: [operate] } })
    }
  }, { upsert: true }).catch((e: unknown) => logger.error(e));
}

async function updateUseCount(proxy: string): Promise<void> {
  await update(proxy, {}, { useCount: 1 });
}

async function updateInvalidOperate(proxy: string, operate: string): Promise<void> {
  await update(proxy, {}, {}, operate);
}

async function deleteProxy(proxy?: string): Promise<void> {
  if (proxy) {
    const agent = { ip: proxy.split(':')[0], port: proxy.split(':')[1] };
    Proxy.model.deleteOne({ ip: agent.ip, port: agent.port }).catch();
  }
}

async function getValidProxies(operate: string): Promise<Array<{ proxy: string; type: string; ip: string; port: string; expire_time: string; useCount?: number } | null> | null> {
  return await Proxy.model.find({ invalidOperates: { $ne: operate } })
    .sort({ expire_time: 1 })
    .then(agents => agents?.map(formatProxy))
    .catch(e => {
      logger.error(e);
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
  }
}

export default {
  insert,
  delete: deleteProxy,
  updateInvalidOperate,
  updateUseCount,
  getValidProxies,
};
