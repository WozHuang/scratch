const express = require('express');
const cors = require('cors');
const { z } = require('zod');
const { initTRPC } = require('@trpc/server');
const { createExpressMiddleware } = require('@trpc/server/adapters/express');
const path = require('path');


const t = initTRPC.create();

const appRouter = t.router({
  hello: t.procedure.input(z.string()).query(({ input }) => `Hello, ${input}!`),
  add: t.procedure
    .input(z.object({ a: z.number(), b: z.number() }))
    .mutation(({ input }) => input.a + input.b),
});

const app = express();

// // ✅ 允许跨域
// app.use(
//   cors({
//     origin: "http://localhost:5173", // 前端地址，开发时可改成 *
//     methods: ["GET", "POST", "OPTIONS"],
//     allowedHeaders: ["Content-Type"],
//   })
// );

// ✅ 解析 JSON body
app.use(express.json());

// 默认返回 index.html
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "../public", "index.html"));
});
// ✅ 提供静态文件 (index.html)
app.use(express.static(path.join(__dirname, "../public")));

// ✅ 挂载 tRPC 路由
app.use(
  "/trpc",
  createExpressMiddleware({
    router: appRouter,
  })
);

app.listen(3000, '127.0.0.1', () => {
  console.log("tRPC Express server running at http://localhost:3000/");
});
