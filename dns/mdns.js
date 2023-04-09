const mdns = require('multicast-dns')({
  interface: '192.168.2.8' // 指定监听的网卡
  // loopback: true, // receive your own packets
});

// 监听 mdns 响应
mdns.on('response', function (response) {
  console.log('got a response packet:', response?.answers?.length, response);
});

// 回应 mdns
mdns.on('query', function (query) {
  console.log('got a query packet:', query);
  if (query.questions[0] && query.questions[0].name === 'fff.local') {
    console.log('respond a query');
    mdns.respond({
      answers: [{ name: 'fff.local', type: 'AAAA', data: 'fe80::e94c:93c7:5e2b:3613' }]
    });
  }
});

// 触发mdns查询
mdns.query({
  questions: [{ name: 'fff.local', type: '*' }]
});
