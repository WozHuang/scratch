最简单的 webpack-dev-server 使用

1. 使用 externals 配置从 cdn 加载依赖，也可以直接使用页面已有变量
2. 使用 `webpack-manifest-plugin` 输出构建产物清单 `manifest.json`
3. 使用 loader 语法引入在代码里获得 less 编译后的代码
4. 使用 babel，@babel/preset-env，core-js 兼容到 IE11（但是应当要判断浏览器后才引入 polyfill，直接使用 useBuiltIns 参数会导致所有的浏览器都加载了 polyfill 增大体积）,配置 webpack target 参数
5. 使用 `mini-css-extract-plugin` 分离 css 产物
6. 使用 cacheGroups 配置划分代码
7. 使用 HtmlWebpackPlugin 生成 html 并注入指定的 entry
8. devServer.devMiddleware.writeToDisk 参数可以用来写入硬盘文件

