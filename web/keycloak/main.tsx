import Keycloak from 'keycloak-js';
import React, { useEffect, useState } from 'react';
import { createRoot } from 'react-dom/client';

const keycloak = new Keycloak({
  url: 'http://172.16.10.54:8081',
  realm: 'test',
  clientId: 'test-app'
});

const App = () => {
  const [status, setStatus] = useState('loading');
  useEffect(() => {
    keycloak
      .init({ onLoad: 'login-required' })
      .then((authenticated) => {
        setStatus(
          authenticated ? `已登录为：${keycloak.idTokenParsed?.given_name}(${keycloak.idTokenParsed?.email})` : '未登录'
        );
      })
      .catch((error) => {
        setStatus('初始化失败：' + error);
      });
  }, []);
  return (
    <div>
      <p>当前状态: {status}</p>
      <button onClick={() => keycloak.logout()}>退出登录</button>
    </div>
  );
};

const root = createRoot(document.getElementById('root') as HTMLElement);
root.render(<App />);
