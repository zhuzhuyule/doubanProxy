import Proxy, { ProxyType } from '@models/proxy.model';
import tool from '@utils/tool';
import dayjs from 'dayjs';

const DATE_FORMAT = 'YYMMDDHHmmss';

async function insert (agent: ProxyType) {
  return await tool.updateTable(
    { ip: agent.ip, port: agent.port },
    { ...agent, useCount: 0, invalidTime: 0 },
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

async function updateUseCount (proxy: string) {
  return await update(proxy, {}, { useCount: 1 });
}

async function updateInvalidTime (proxy: string) {
  const time = parseInt(dayjs().format(DATE_FORMAT), 10);
  return await update(proxy, { invalidTime: time });
}

async function findTopProxy(type = 'free', top = 10, { hour = 0, min = 0, baseDate = '' }) {
  const time = parseInt(dayjs(baseDate || undefined).hour(-hour).minute(-min).format(DATE_FORMAT), 10);
  return await Proxy.model.find({ type, expire_time: { $gt: time }})
    .sort({ expire_time: -1, _id: -1 })
    .limit(top)
    .sort({ expire_time: 1, _id: 1 })
    .catch(e => {
      console.log(e);
      return null;
    });
}

async function findFree(top = 10, { hour = 0, min = 0, baseDate = '' }) {
  return await findTopProxy('free', top, { hour, min, baseDate });
}
async function findSun(top = 10, { hour = 0, min = 0, baseDate = '' }) {
  return await findTopProxy('sun', top, { hour, min, baseDate }).then(doc => {
    return doc;
  });
}

export default {
  insert,
  updateInvalidTime,
  updateUseCount,
  findFree,
  findSun,
};
