const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');

module.exports = {
  mode: 'development',
  entry: './index.web.js',
  target: ['web', 'es5'],
  experiments: {
    outputModule: false,
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/',
    globalObject: 'this',
  },
  resolve: {
    extensions: ['.web.js', '.js', '.json', '.web.jsx', '.jsx', '.ts', '.tsx'],
    alias: {
      'react-native$': 'react-native-web',
      'react-native-vector-icons': '@expo/vector-icons',
      '@koale/useworker': false,
      'lodash-es': 'lodash',
      '@react-native-vector-icons/material-design-icons': '@react-native-vector-icons/material-design-icons',
      '@react-native-community/netinfo': path.resolve(__dirname, 'src/utils/netinfo-web-shim.js'),
      // Ensure single React instance
      'react': path.resolve(__dirname, 'node_modules/react'),
      'react-dom': path.resolve(__dirname, 'node_modules/react-dom'),
    },
    fallback: {
      'Inspector': false,
      'Platform': false,
      fs: false,
      path: require.resolve('path-browserify'),
      crypto: require.resolve('crypto-browserify'),
      stream: require.resolve('stream-browserify'),
      buffer: require.resolve('buffer'),
      process: require.resolve('process/browser'),
      "assert": false,
      "http": false,
      "https": false,
      "os": false,
      "url": false,
      "zlib": false,
      "net": false,
      "tls": false,
      "@koale/useworker": false,
    },
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx|ts|tsx)$/,
        exclude: /node_modules\/(?!(@expo\/vector-icons|react-native-vector-icons|@react-navigation|decode-uri-component|query-string|create-react-class))/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: { browsers: ['> 1%', 'last 2 versions'] },
                modules: 'commonjs',
                useBuiltIns: false
              }], 
              ['@babel/preset-react', { runtime: 'classic' }]
            ],
            plugins: [
                '@babel/plugin-proposal-class-properties'
              ]
          },
        },
      },
      {
        test: /\.js$/,
        include: /node_modules\/(decode-uri-component|create-react-class|query-string)/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: [
              ['@babel/preset-env', {
                targets: 'defaults',
                modules: 'commonjs'
              }]
            ]
          }
        }
      },
      {
        test: /\.(png|jpe?g|gif)$/i,
        type: 'asset/resource',
      },
      {
        test: /\.svg$/i,
        use: ['@svgr/webpack'],
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/i,
        type: 'asset/resource',
        generator: {
          filename: 'fonts/[name][ext]'
        }
      },
      {
        test: /Inspector\.js$/,
        include: /node_modules\/react-native/,
        use: 'null-loader',
      },
      {
        test: /Platform\.js$/,
        include: /node_modules\/react-native/,
        use: 'null-loader',
      },
      {
        test: /.*\/Inspector\/.*\.js$/,
        include: /node_modules\/react-native/,
        use: 'null-loader',
      },
      {
        test: /.*\/Utilities\/Platform\.js$/,
        include: /node_modules\/react-native/,
        use: 'null-loader',
      },
    ],
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './web/index.html',
      inject: true,
    }),
    new webpack.ProvidePlugin({
      Buffer: ['buffer', 'Buffer'],
      process: 'process/browser',
      React: 'react',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('development'),
      'process.env.EXPO_PUBLIC_ENV': JSON.stringify('development'),
      'global': 'globalThis',
      'window.React': 'React',
      '__DEV__': true,
      'global.__DEV__': true,
      'window.__DEV__': true,
    }),

  ],
  // Remove externals to bundle React locally instead of using CDN
  // externals: {
  //   'react': 'React',
  //   'react-dom': 'ReactDOM',
  //   'react-dom/client': 'ReactDOM',
  // },
  optimization: {
    splitChunks: false,
  },
  devServer: {
    port: 19007,
    host: 'localhost',
    historyApiFallback: true,
    static: {
      directory: path.join(__dirname, 'web'),
    },
    client: false,
    webSocketServer: false,
    hot: false,
    liveReload: false,
  },
};