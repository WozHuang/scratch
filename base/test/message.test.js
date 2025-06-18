import test, { before, describe } from 'node:test';
import { WeChatBot } from '../dist/index.js';

const key = '';

describe('test wechat bot', () => {
  before(() => {
    console.assert(!!key, 'key is required');
  })
  test('test send text', () => {
    const bot = new WeChatBot(key);
    bot.sendText('Hello world!')
      .then(msg => {
        console.log(msg);
      })
  })
})
