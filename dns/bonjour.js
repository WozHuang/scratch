const Bonjour = require('bonjour-service').default;
const instance = new Bonjour({
  interface: '192.168.2.8',
});

// 查询一个类型为 barrage 的服务
instance.find({type:'barrage', protocol: 'udp'}, function (service) {
  console.log('Found services: ', service);
});

// 发布一个类型为 barrage 的服务
instance.publish({ name: 'biubiubiu', type: 'barrage', port: 9999, protocol: 'udp' })

