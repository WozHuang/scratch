import Koa from 'koa';
import { PassThrough } from 'stream';

const app = new Koa();

app.use(async (ctx) => {
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
    stream = ctx.res
  }

  // 模拟异步数据生成
  const messages = ['First', 'Second', 'Third', 'Fourth', 'Fifth'];

  for (const message of messages) {
    stream.write(JSON.stringify({ message, timestamp: Date.now() }) + '\n');
    await new Promise(resolve => setTimeout(resolve, 1000));
  }

  stream.end();
});

app.listen(3000);
