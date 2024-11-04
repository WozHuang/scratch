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
      - [Electron](#electron)
      - [移动端开发](#移动端开发)
  - [NodeJS](#nodejs)
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
    - [远程开发](#远程开发)
  - [命令行工具](#命令行工具)

## Web

### Loader / Plugin

- [worker-loader](https://www.npmjs.com/package/worker-loader)

### Polyfill

- [buffer](https://www.npmjs.com/package/buffer) / [events](https://www.npmjs.com/package/events)
- core-js

### Web Framework

#### [React](https://reactjs.org/)

- [Redux](https://redux.js.org/) / redux-persist(deprecated)
- [MobX](https://mobx.js.org) / mobx-persist(deprecated) / mobx-remotedev(deprecated)
- [ant-design](https://ant.design/): UI Component
- [ant-design-pro](https://pro.ant.design) / [umi](https://umijs.org/): 管理后台脚手架
- [qiankun](https://qiankun.umijs.org/zh): 微前端
- [react-router](https://reactrouter.com)：路由
- [react-intl](https://formatjs.io/docs/react-intl/): i18n
- 拖拽功能实现：
  - [react-dnd](https://github.com/react-dnd/react-dnd)（没有过渡动画）
  - [react-beautiful-dnd](https://github.com/atlassian/react-beautiful-dnd)（有过渡动画，但处于弃坑状态）
  - [dnd-kit](https://github.com/clauderic/dnd-kit)（比较积极维护也有过渡动画，推荐）
- [ahooks](https://ahooks.js.org/zh-CN): hooks 工具集
- fluent-ui

#### [Vue](https://vuejs.org/)

- [ant-design-vue](https://github.com/vueComponent/ant-design-vue): ant-design 的 vue 实现
- [ant-design-vue-pro](https://github.com/vueComponent/ant-design-vue-pro): 类似 ant-design-pro 的 vue 实现
- [vant](https://vant-ui.github.io): Mobile UI Component
- [vue-amap](https://github.com/ElemeFE/vue-amap): 高德地图

#### [React-Native](https://reactnative.dev/)

- [中文文档](https://reactnative.cn/): 更新不及时，但能减少 GFW 下搭建开发环境踩坑
- [ant-design-mobile-rn](https://github.com/ant-design/ant-design-mobile-rn): UI Component
- [react-native-async-storage](https://github.com/react-native-async-storage/async-storage): Data storage system for React Native.
- [@types/react-native](https://www.npmjs.com/package/@types/react-native)
- [react-native-config](https://github.com/luggit/react-native-config) / [react-native-device-info](https://github.com/react-native-device-info/react-native-device-info) / react-native-imei
- react-native-knex / react-native-sqlite-storage: Use Sqlite in RN with knex
- [react-navigation](https://github.com/react-navigation/react-navigation)
- [rn-app-upgrade](https://www.npmjs.com/package/rn-app-upgrade)
- [react-native-vector-icons](https://github.com/oblador/react-native-vector-icons)
- [react-native-debugger](https://github.com/jhen0409/react-native-debugger)

#### [小程序 MiniProgram](https://developers.weixin.qq.com/miniprogram/dev/framework/)

- [Taro](https://github.com/NervJS/taro): React in weapp
- [uni-app](https://github.com/dcloudio/uni-app): Vue in weapp
- [vant-weapp](https://youzan.github.io/vant-weapp): UI Component for weapp
- [uview-ui](https://www.uviewui.com/): UI Component for uni-app
- [Awesome-qr.js](https://github.com/SumiMakito/Awesome-qr.js) / [vue-qr](https://github.com/Binaryify/vue-qr): QR 码
- [axios-miniprogram-adapter](https://github.com/bigmeow/axios-miniprogram-adapter)

#### Electron

- electron

#### 移动端开发

- cordova
- react-native

## NodeJS

- strapi
- vercel

## Utils

### JS Utils

- [Moment.js](https://momentjs.com/) / [Day.js](https://day.js.org/): 时间计算和格式化
- [Numeral.js](http://numeraljs.com/) / [decimal.js](https://github.com/MikeMcl/decimal.js) : 数字处理和格式化，[nzh 中文格式化](https://www.npmjs.com/package/nzh)
- [lodash](https://lodash.com/) / [lodash-decorators](https://www.npmjs.com/package/lodash-decorators)
- [pako](https://www.npmjs.com/package/pako) / [lz-string](https://www.npmjs.com/package/lz-string): 压缩
- [qs](https://www.npmjs.com/package/qs): parse and stringify query-string
- [axios](https://www.npmjs.com/package/axios): 请求
- [echarts](https://echarts.apache.org) / [antv](https://antv.vision): 数据可视化

### Web Utils

- [Cropper.js](https://fengyuanchen.github.io/cropperjs): 图片裁剪
- [cax](https://github.com/dntzhang/cax): 兼容 Web 和小程序的 Canvas 引擎
- [Intro.js](https://introjs.com/): 引导，[参考](https://juejin.cn/post/6844904128393510919)
- [Hammer.js](https://hammerjs.github.io/) / [AlloyFinger](https://github.com/AlloyTeam/AlloyFinger): 手势
- [FileSaver.js](https://github.com/eligrey/FileSaver.js): 文件保存
- [filesize.js](https://github.com/avoidwork/filesize.js): file size 格式化
- [js-audio-recorder](https://github.com/2fps/recorder): 录音
- [SortableJS](http://sortablejs.github.io/Sortable/): 拖拽排序
- [vConsole](https://github.com/Tencent/vConsole): 调试面板
- [html2canvas](https://github.com/niklasvh/html2canvas)
- [clipboard.js](https://github.com/zenorocha/clipboard.js): 剪贴板
- [wangEditor](https://www.wangeditor.com/) / [Quill.js](https://quilljs.com/): 富文本编辑器
- [history](https://github.com/remix-run/history): 类似 history api, 支持 browser, hash, memory
- [localForage](https://github.com/localForage/localForage): 简化的本地存储
- [lozad.js](https://github.com/ApoorvSaxena/lozad.js)：基于 IntersectionObserver 和 MutationObserver 实现的懒加载
- [emoji-mart](https://github.com/missive/emoji-mart): Web 表情选择器
- autolinker

### NodeJS Utils

- [fs-extra](https://juejin.cn/post/6844903641594216455): 扩展 fs 模块
- [rimraf](https://www.npmjs.com/package/rimraf): `rm -rf`工具
- [compare-versions](https://www.npmjs.com/package/compare-versions)
- [execa](https://www.npmjs.com/package/execa): 替代直接操作 child_process
- [log4js](https://github.com/log4js-node/log4js-node) / [winston](https://github.com/winstonjs/winston): 日志

## 日志 Log

- [Sentry](https://sentry.io)
- [winstonjs](https://github.com/winstonjs/winston)

## 测试 Testing

- [jest](https://jestjs.io/)
- [Karma](https://karma-runner.github.io/)

## 安全 Security

- [PKI.js](https://pkijs.org/): PKI 相关操作，包含密钥对生成、证书签名等
- [crypto-js](https://github.com/brix/crypto-js): 加密算法，[文档](https://cryptojs.gitbook.io/docs/)
- [sm-crypto](https://github.com/JuneAndGreen/sm-crypto): 国密算法 sm2/sm3/sm4

## Tools

### Dev Tools

- nodemon
- cross-env
- prettier
- anywhere
- json-server
- pm2

### 包管理工具 Package Manager

- [yarn](https://yarnpkg.com/)
- [pnpm](https://pnpm.io/): 安装更快，占用更少
- lerna: monorepo
- yalc: 本地 link 工具
- cnpm
- npkill: 批量清理 node_modules
- bower

### Compiler

- Typescript
- Babel
- Postcss / Less / Sass

### 构建工具 Bundler

- [webpack](https://webpack.js.org/)
- [rollup.js](https://rollupjs.org)
- [vite](https://vitejs.dev/)
- [gulp.js](https://gulpjs.com/)
- [astro](https://astro.build/)
- grunt

### 代码混淆

- [JavaScript Obfuscator](https://obfuscator.io/)

### 远程开发

- [code-server](https://github.com/coder/code-server) —— 运行在浏览器里的 vscode

## 命令行工具

- cloc
- rimraf
