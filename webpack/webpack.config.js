const HtmlWebpackPlugin = require('html-webpack-plugin');
const { WebpackManifestPlugin } = require('webpack-manifest-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');

/**
 * @type {WebpackConfig}
 */
const webpackConfig = {
  performance: {
    hints: false
  },
  mode: 'production',
  target: ['web', 'es5'],
  entry: {
    // main: './src/main/index.js',
    react: './src/react/index.js',
    react2: './src/react2/index.js'
  },
  // externalsType: 'script',
  // externals: {
  //   jquery: ['https://cdn.jsdelivr.net/npm/jquery@3.6.4/dist/jquery.min.js', '$'],
  //   react: ['https://cdn.jsdelivr.net/npm/react@18.2.0/umd/react.production.min.js', 'React'],
  //   'react-dom/client': ['https://cdn.jsdelivr.net/npm/react-dom@18.2.0/umd/react-dom.production.min.js', 'ReactDOM']
  // },
  // devtool: 'source-map',
  output: {
    publicPath: '',
    // filename: '[name].[fullhash:4].js',
    filename: '[name].js',
    clean: true
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        // exclude: /node_modules[/\\](?!(react)\/).*/,
        // include: [
        //   {not: /node_modules/},
        //   /node_modules[\\/](react|react-dom)[\\/]/,
        // ],
        use: [
          {
            loader: 'babel-loader',
            options: {
              presets: [
                [
                  '@babel/preset-env',
                  {
                    targets: '> 0.25%, IE 11',
                    useBuiltIns: 'usage',
                    corejs: {
                      version: '3'
                    }
                  }
                ],
                ['@babel/preset-react'] // automatically register React
              ],
              plugins: [
                // ["@babel/plugin-proposal-decorators", { "legacy": true }],
                // ["@babel/plugin-proposal-class-properties", { "loose": true }]
                // ["@babel/plugin-transform-runtime",{
                //   // corejs: 3
                // }]
              ]
            }
          }
        ]
      },
      // compiles Less to CSS
      {
        test: /\.less$/i,
        oneOf: [
          {
            test: /\.extract\.\w+$/i,
            use: [
              // 不自动注入
              MiniCssExtractPlugin.loader,
              'css-loader',
              // 'less-loader'
              {
                loader: "less-loader",
                options: {
                  javascriptEnabled: true
                }
              }
            ]
          },
          {
            use: [
              'style-loader',
              'css-loader',
              // 'less-loader'
              {
                loader: "less-loader",
                options: {
                  lessOptions: {
                    javascriptEnabled: true
                  }
                }
              }
            ]
          }
        ]
      },
      // {
      //   test: /\.css$/i,
      //   use: ['style-loader', 'css-loader']
      // },
      {
        test: /\.ttf$/i,
        use: ['file-loader']
      },
    ],
  },
  optimization: {
    minimize: false,
    splitChunks: {
      chunks: 'all',
      // filename: '[name].[contenthash:4].js',
      // filename: '[name].js',
      // minSize: 200000,
      cacheGroups: {
        commons: {
          test: /[\\/]node_modules[\\/]/,
          name: 'vendors',
          chunks: 'all'
        }
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
      }
    }
  },
  plugins: [
    // new HtmlWebpackPlugin({
    //   chunks: ['main']
    //   // inject: false,
    //   // templateContent: `<script src="/main.js"></script>`
    // }),
    new HtmlWebpackPlugin({
      filename: 'react.html',
      chunks: [
        'react',
        // 'react2'
      ]
    }),
    new WebpackManifestPlugin(),
    new MiniCssExtractPlugin({
      runtime: false
    })
  ],
  devServer: {
    port: 8900,
    // devMiddleware: {
    //   writeToDisk: true
    // }
  }
};

module.exports = webpackConfig;
