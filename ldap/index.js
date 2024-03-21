const ldap = require('ldapjs');

const ldapConfig = {
  url: 'ldap://172.16.10.54:389', // LDAP 服务器的 URL
  bindDn: 'cn=admin,dc=test,dc=cn', // 用于绑定的 DN
  bindCredentials: '123456', // 用于绑定的凭据
  searchBase: 'dc=test,dc=cn', // 用户搜索的基本路径
  searchFilter: '(uid={{username}})' // 用户搜索的过滤器，{{username}} 将由实际用户名替换
};

function ldapAuth(username, password) {
  return new Promise((resolve, reject) => {
    const client = ldap.createClient({
      url: ldapConfig.url
    });

    client.bind(ldapConfig.bindDn, ldapConfig.bindCredentials, (err) => {
      if (err) {
        client.unbind();
        return reject(err);
      }

      const searchOptions = {
        filter: ldapConfig.searchFilter.replace('{{username}}', username),
        scope: 'sub'
      };

      client.search(ldapConfig.searchBase, searchOptions, (err, search) => {
        if (err) {
          client.unbind();
          return reject(err);
        }

        search.on('searchEntry', (entry) => {
          // 用户被找到，尝试绑定用户
          client.bind(String(entry.dn), password, (err) => {
            client.unbind();
            if (err) {
              return reject(err);
            }
            resolve(true); // 认证成功
          });
        });

        search.on('error', (err) => {
          client.unbind();
          reject(err);
        });

        search.on('end', (result) => {
          if (result.status !== 0) {
            reject(new Error('User not found'));
          }
        });
      });
    });
  });
}

// 使用示例
const username = 'user1';
const password = '123456';

ldapAuth(username, password)
  .then((authenticated) => {
    console.log('LDAP authentication successful:', authenticated);
  })
  .catch((err) => {
    console.error('LDAP authentication failed:', err);
  });
