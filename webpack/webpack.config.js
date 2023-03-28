const HtmlWebpackPlugin = require('html-webpack-plugin');

/**
 * @type {WebpackConfig}
 */
const webpackConfig = {
  mode: 'development',
  entry: './index.js',
  externalsType: 'script',
  externals: {
    jquery: [
      'https://cdn.jsdelivr.net/npm/jquery@3.6.4/dist/jquery.min.js',
      '$'
    ]
  },
  // devtool: 'inline-source-map',
  // output: {
  //   filename: '[name].js',
  //   // path: 'dist',
  //   clean: true
  // },
  plugins: [new HtmlWebpackPlugin()]
};

module.exports = webpackConfig;
