import { Frequency, RRule, Options, Options as RRuleOptions, RRuleSet } from './temp-rrule-lib/src';

// import * as dayjs from 'dayjs';
import dayjs from 'dayjs';
import { getLogger } from '@woz-scratch/base';

const logger = getLogger('rrule');

function main() {
  const rangeStart = dayjs().startOf('year').toDate(),
    rangeEnd = dayjs(rangeStart).add(2, 'year').toDate();

  const options: Partial<Options> = {
    freq: Frequency.YEARLY,
    dtstart: dayjs('2025-07-30T11:00:00.000Z').toDate(),
    interval: 1,
    count: 4,
    until: dayjs('2029-03-15T23:59:59.999Z').toDate(),
    bymonth: [2],
    bymonthday: [31]
  };

  const opt = {
    freq: 0,
    dtstart: dayjs('2025-02-28T09:00:00.000Z').toDate(),
    interval: 1,
    until: dayjs('2029-03-15T23:59:59.999Z').toDate(),
    bymonth: [2],
    bymonthday: [31]
  };

  // const rr = new RRule(options);
  const rr = new RRule(opt);
  // console.time('between')
  // const result = rr.between(rangeStart, rangeEnd);
  // console.timeEnd('between');

  const rruleSet = new RRuleSet();
  rruleSet.rrule(rr);
  console.time('between2');
  const result2 = rruleSet.between(rangeStart, rangeEnd);
  console.timeEnd('between2');

  console.log(result2);
}

export function expandRepeatRule() {
  logger.info('expandRepeatRule');
  const rruleSet = new RRuleSet();

  const start = new Date('2025-06-30T00:00:00.000Z');
  const end = new Date('2025-08-10T00:00:00.000Z');

  const options: Partial<RRuleOptions> = {
    freq: 0,
    dtstart: new Date('2025-02-28T09:00:00.000Z'),
    interval: 1,
    until: new Date('2029-03-15T23:59:59.999Z'),
    bymonth: [2],
    bymonthday: [31]
  };

  rruleSet.rrule(new RRule(options));
  const startN: number = Date.now();
  let result = rruleSet.between(start, end, true) as Date[];
  const endN = Date.now();
  if (endN - startN > 300) {
    logger.info('duration:', endN - startN, `, start:${start}, end:${end}, options:${JSON.stringify(options)}`);
  }
  logger.info('result:', result);
  return result;
}

expandRepeatRule();
