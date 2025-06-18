import test, { describe } from 'node:test';
import { delay, isMainMeta } from '../dist/index.js';

describe('test util', () => {
  test('test delay', async () => {
    await delay(50);
    console.log('delay');
  })
  test('test isMainMeta', () => {
    const result = isMainMeta(import.meta);
    console.log('isMainMeta: ', result);
  })
})
