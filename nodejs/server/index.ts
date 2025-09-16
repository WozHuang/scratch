import Koa from 'koa';
import Router from '@koa/router';
import { PassThrough } from 'stream';

const app = new Koa();
const router = new Router();

router.get('/chunked', async (ctx, next) => {
  // 设置响应头
  ctx.set('Transfer-Encoding', 'chunked');
  ctx.set('Content-Type', 'application/json');
  ctx.status = 200;

  const useStreamApi = false;
  let stream;
  if (useStreamApi) {
    stream = new PassThrough();
    ctx.body = stream;
  } else {
    stream = ctx.res;
  }

  // 模拟异步数据生成
  const messages = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];

  for (const message of messages) {
    stream.write(JSON.stringify({ message, timestamp: Date.now() }) + '\n');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  stream.end();
});

/**
 * SSE 接口
 * @see https://juejin.cn/post/7389081879909629993
 */
router.get('/sse', async (ctx, next) => {

  ctx.set({
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Connection': 'keep-alive',
  });

  ctx.status = 200;

  const useStreamApi = false;
  let stream;
  if (useStreamApi) {
    stream = new PassThrough();
    ctx.body = stream;
  } else {
    stream = ctx.res;
  }

  // 模拟异步数据生成
  const messages = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];

  for (const message of messages) {
    stream.write(JSON.stringify({ message, timestamp: Date.now() }) + '\n');
    await new Promise((resolve) => setTimeout(resolve, 1000));
  }

  stream.end();

  // 清理连接
  ctx.req.on('close', () => {
    stream.end();
  });
});

app
  .use(router.routes())
  .listen(3000);
