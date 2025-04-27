import { add } from './index';
import { getLogger } from '@woz-scratch/base';

const logger = getLogger('jest-test');

describe('test api', () => {
  test('1+1', async () => {
    logger.debug('test api');
    expect(add(1, 2)).toBe(3);
  });
});
