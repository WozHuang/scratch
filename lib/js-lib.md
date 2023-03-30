# js-lib

> 一些用过的 js 相关资源

**相关推荐：**

- [sorrycc/awesome-javascript](https://github.com/sorrycc/awesome-javascript)
- [awesomejs.dev](https://awesomejs.dev/)

## 目录

- [js-lib](#js-lib)
  - [目录](#目录)
  - [Web](#web)
    - [Loader / Plugin](#loader--plugin)
    - [Polyfill](#polyfill)
    - [Web Framework](#web-framework)
      - [React](#react)
      - [Vue](#vue)
      - [React-Native](#react-native)
      - [小程序 MiniProgram](#小程序-miniprogram)
  - [Utils](#utils)
    - [JS Utils](#js-utils)
    - [Web Utils](#web-utils)
    - [NodeJS Utils](#nodejs-utils)
  - [日志 Log](#日志-log)
  - [测试 Testing](#测试-testing)
  - [安全 Security](#安全-security)
  - [Tools](#tools)
    - [Dev Tools](#dev-tools)
    - [包管理工具 Package Manager](#包管理工具-package-manager)
    - [Compiler](#compiler)
    - [构建工具 Bundler](#构建工具-bundler)
    - [代码混淆](#代码混淆)

## Web

### Loader / Plugin

1. [worker-loader](https://www.npmjs.com/package/worker-loader)

### Polyfill

1. [buffer](https://www.npmjs.com/package/buffer) / [events](https://www.npmjs.com/package/events)
2. core-js

### Web Framework

#### [React](https://reactjs.org/)

1.  [Redux](https://redux.js.org/) / redux-persist(deprecated)
2.  [MobX](https://mobx.js.org) / mobx-persist(deprecated) / mobx-remotedev(deprecated)
3.  [ant-design](https://ant.design/): UI Component
4.  [ant-design-pro](https://pro.ant.design) / [umi](https://umijs.org/): 管理后台脚手架
5.  [qiankun](https://qiankun.umijs.org/zh): 微前端
6.  [react-router](https://reactrouter.com)
7.  react-intl: i18n

#### [Vue](https://vuejs.org/)

1. [ant-design-vue](https://github.com/vueComponent/ant-design-vue): ant-design 的 vue 实现
2. [ant-design-vue-pro](https://github.com/vueComponent/ant-design-vue-pro): 类似 ant-design-pro 的 vue 实现
3. [vant](https://vant-ui.github.io): Mobile UI Component
4. [vue-amap](https://github.com/ElemeFE/vue-amap): 高德地图

#### [React-Native](https://reactnative.dev/)

1. [中文文档](https://reactnative.cn/): 更新不及时，但能减少 GFW 下搭建开发环境踩坑
2. [ant-design-mobile-rn](https://github.com/ant-design/ant-design-mobile-rn): UI Component
3. [react-native-async-storage](https://github.com/react-native-async-storage/async-storage): Data storage system for React Native.
4. [@types/react-native](https://www.npmjs.com/package/@types/react-native)
5. [react-native-config](https://github.com/luggit/react-native-config) / [react-native-device-info](https://github.com/react-native-device-info/react-native-device-info) / react-native-imei
6. react-native-knex / react-native-sqlite-storage: Use Sqlite in RN with knex
7. [react-navigation](https://github.com/react-navigation/react-navigation)
8. rn-app-upgrade
9. react-native-vector-icons
10. [react-native-debugger](https://github.com/jhen0409/react-native-debugger)

#### [小程序 MiniProgram](https://developers.weixin.qq.com/miniprogram/dev/framework/)

1. [Taro](https://github.com/NervJS/taro): React in weapp
2. [uni-app](https://github.com/dcloudio/uni-app): Vue in weapp
3. [vant-weapp](https://youzan.github.io/vant-weapp): UI Component for weapp
4. [uview-ui](https://www.uviewui.com/): UI Component for uni-app
5. [Awesome-qr.js](https://github.com/SumiMakito/Awesome-qr.js) / [vue-qr](https://github.com/Binaryify/vue-qr): QR 码
6. [axios-miniprogram-adapter](https://github.com/bigmeow/axios-miniprogram-adapter)

## Utils

### JS Utils

1. [Moment.js](https://momentjs.com/) / [Day.js](https://day.js.org/): 时间计算和格式化
2. [Numeral.js](http://numeraljs.com/) / [decimal.js](https://github.com/MikeMcl/decimal.js) : 数字处理和格式化，[nzh 中文格式化](https://www.npmjs.com/package/nzh)
3. [lodash](https://lodash.com/) / [lodash-decorators](https://www.npmjs.com/package/lodash-decorators)
4. [pako](https://www.npmjs.com/package/pako) / [lz-string](https://www.npmjs.com/package/lz-string): 压缩
5. [qs](https://www.npmjs.com/package/qs): parse and stringify query-string
6. [axios](https://www.npmjs.com/package/axios): 请求
7. [echarts](https://echarts.apache.org) / [antv](https://antv.vision): 数据可视化

### Web Utils

1. [Cropper.js](https://fengyuanchen.github.io/cropperjs): 图片裁剪
2. [cax](https://github.com/dntzhang/cax): 兼容 Web 和小程序的 Canvas 引擎
3. [Intro.js](https://introjs.com/): 引导，[参考](https://juejin.cn/post/6844904128393510919)
4. [Hammer.js](https://hammerjs.github.io/) / [AlloyFinger](https://github.com/AlloyTeam/AlloyFinger): 手势
5. [FileSaver.js](https://github.com/eligrey/FileSaver.js): 文件保存
6. [filesize.js](https://github.com/avoidwork/filesize.js): file size 格式化
7. [js-audio-recorder](https://github.com/2fps/recorder): 录音
8. [SortableJS](http://sortablejs.github.io/Sortable/): 拖拽排序
9. [vConsole](https://github.com/Tencent/vConsole): 调试面板
10. [html2canvas](https://github.com/niklasvh/html2canvas)
11. [clipboard.js](https://github.com/zenorocha/clipboard.js): 剪贴板
12. [wangEditor](https://www.wangeditor.com/) / [Quill.js](https://quilljs.com/): 富文本编辑器
13. [history](https://github.com/remix-run/history): 类似 history api, 支持 browser, hash, memory
14. [localForage](https://github.com/localForage/localForage): 简化的本地存储

### NodeJS Utils

1. [fs-extra](https://juejin.cn/post/6844903641594216455): 扩展 fs 模块
2. [rimraf](https://www.npmjs.com/package/rimraf): `rm -rf`工具
3. [compare-versions](https://www.npmjs.com/package/compare-versions)
4. [execa](https://www.npmjs.com/package/execa): 替代直接操作 child_process
5. [log4js](https://github.com/log4js-node/log4js-node) / [winston](https://github.com/winstonjs/winston): 日志

## 日志 Log

1. [Sentry](https://sentry.io)

## 测试 Testing

1. [jest](https://jestjs.io/)
2. [Karma](https://karma-runner.github.io/)

## 安全 Security

1. [PKI.js](https://pkijs.org/): PKI 相关操作，包含密钥对生成、证书签名等
2. [crypto-js](https://github.com/brix/crypto-js): 加密算法，[文档](https://cryptojs.gitbook.io/docs/)
3. [sm-crypto](https://github.com/JuneAndGreen/sm-crypto): 国密算法 sm2/sm3/sm4

## Tools

### Dev Tools

1. nodemon
2. cross-env
3. prettier

### 包管理工具 Package Manager

1. [yarn](https://yarnpkg.com/)
2. [pnpm](https://pnpm.io/): 安装更快，占用更少
3. lerna: monorepo
4. yalc: 本地 link 工具

### Compiler

1. Typescript
2. Babel
3. Postcss / Less / Sass

### 构建工具 Bundler

1. [webpack](https://webpack.js.org/)
2. [rollup.js](https://rollupjs.org)
3. [vite](https://vitejs.dev/)
4. [gulp.js](https://gulpjs.com/)

### 代码混淆

1. [JavaScript Obfuscator](https://obfuscator.io/)
