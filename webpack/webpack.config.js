const HtmlWebpackPlugin = require('html-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

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
  output: {
    filename: '[name].[hash:4].js',
    clean: true
  },
  module:{
    rules: [
      {
        test: /\.less$/i,
        use: [
          // compiles Less to CSS
          'style-loader',
          'css-loader',
          'less-loader',
        ],
      }
    ]
  },
  plugins: [new HtmlWebpackPlugin(), new WebpackManifestPlugin()]
};

module.exports = webpackConfig;
