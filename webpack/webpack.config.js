const HtmlWebpackPlugin = require('html-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');

/**
 * @type {WebpackConfig}
 */
const webpackConfig = {
  mode: 'development',
  entry: {
    main: './index.js',
    react: './src/react/index.js',
    react2: './src/react2/index.js',
  },
  externalsType: 'script',
  externals: {
    jquery: ['https://cdn.jsdelivr.net/npm/jquery@3.6.4/dist/jquery.min.js', '$'],
    react: ['https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js', 'React'],
    'react-dom/client': ['https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js', 'ReactDOM']
  },
  devtool: 'source-map',
  output: {
    // filename: '[name].[fullhash:4].js',
    filename: '[name].js',
    clean: true,
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [['@babel/preset-react']] // automatically register React
            }
          }
        ]
      },
      {
        test: /\.less$/i,
        use: [
          // compiles Less to CSS
          'style-loader',
          'css-loader',
          'less-loader'
        ]
      },
      {
        test: /\.css$/i,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.ttf$/i,
        use: ['file-loader']
      }
    ]
  },
  optimization: {
    splitChunks: {
  //     // chunks: 'all',
      filename: '[name].vendor.js',
      // minSize: 200000,
      cacheGroups: {
  //       // defaultVendors : {
  //       //   name: 'vendor',
  //       //   // test: /[\\/]node_modules[\\/]/,
  //       //   test: /react/,
  //       //   priority: -10,
  //       //   reuseExistingChunk: true,
  //       // },
  //       // defaultVendors: {
  //       //   test: /[\\/]node_modules[\\/]/,
  //       //   priority: -10,
  //       //   reuseExistingChunk: true,
  //       // },
  //       // r: {
  //       //   filename: 'react-bundle.js',
  //       //   test: /react|react-dom/,
  //       //   priority: -10,
  //       //   reuseExistingChunk: true,
  //       // },
  //       // default: {
  //       //   minChunks: 2,
  //       //   priority: -20,
  //       //   reuseExistingChunk: true,
  //       // },
  //
  //
  //       defaultVendors: {
  //         name: 'chunk-vendors',
  //         test: /[\\/]node_modules[\\/]/,
  //         priority: -10,
  //         // chunks: 'initial',
  //       },
  //       common: {
  //         name: 'chunk-common',
  //         minChunks: 2,
  //         priority: -20,
  //         chunks: 'initial',
  //         reuseExistingChunk: true,
  //       },
      },
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      chunks: ['main']
    }),
    new HtmlWebpackPlugin({
      filename: 'react.html',
      chunks: ['react', 'react2']
    }),
    new WebpackManifestPlugin()
  ],
  devServer: {
    port: 8900
  }
};

module.exports = webpackConfig;
