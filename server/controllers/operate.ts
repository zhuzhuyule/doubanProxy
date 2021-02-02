import Operate, { OperateType } from '@models/operate';
import { transferTime, updateTable } from '@utils/tool';
import dayjs from 'dayjs';
import { getLogger } from 'log4js';
const logger = getLogger();

async function update(operate: string, args: Array<string | number>, success = false): Promise<void | OperateType | null> {
    return await updateTable(
      { operate, args },
      { operate, args, success, update: transferTime() },
      Operate.model
    )
      .catch(e => logger.error(e));
}

async function findLatestOne(operate: string, preMin = 20): Promise<OperateType | null> {
  const time = transferTime(dayjs().minute(-1 * preMin));
  const operates = await Operate.model.find({ operate, update: { $gt: time }, success: true} ).sort({ _id: -1 }).limit(1).catch(e => {logger.error(e); return null});
  return operates && operates[0];
}

async function findOne(operateInfo: OperateType): Promise<void | OperateType | null> {
  return await Operate.model.findOne(
    {
      operate: operateInfo.operate,
      args: operateInfo.args
    }
  )
    .catch(e => logger.error(e));
}

export default {
  update,
  findOne,
  findLatestOne,
};
