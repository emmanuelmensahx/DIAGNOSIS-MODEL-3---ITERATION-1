const createExpoWebpackConfigAsync = require('@expo/webpack-config');
const path = require('path');
const webpack = require('webpack');

module.exports = async function (env, argv) {
  const config = await createExpoWebpackConfigAsync(env, argv);

  // Ensure proper resolve extensions for web
  config.resolve.extensions = ['.web.js', '.web.ts', '.web.tsx', '.js', '.ts', '.tsx', '.json'];

  // Add aliases for react-native-vector-icons and react-native-web
  config.resolve.alias = {
    ...config.resolve.alias,
    'react-native-vector-icons': 'react-native-vector-icons/dist',
    'react-native': 'react-native-web',
    // Fix expo-modules-core Platform export
    'expo-modules-core': path.resolve(__dirname, 'expo-modules-core-shim.js'),
    'expo-modules-core/build': path.resolve(__dirname, 'expo-modules-core-shim.js'),
    // Fix asset registry issues - try exact match
    'react-native/Libraries/Image/AssetRegistry$': path.resolve(__dirname, 'web-asset-registry-shim.js'),
  };

  // Use null-loader to completely ignore Inspector files only
  config.module.rules.push(
    {
      test: /Inspector\.js$/,
      include: /node_modules\/react-native/,
      use: 'null-loader',
    },
    {
      test: /.*\/Inspector\/.*\.js$/,
      include: /node_modules\/react-native/,
      use: 'null-loader',
    }
  );

  // Add webpack plugins to completely ignore Inspector modules only
  config.plugins.push(
    new webpack.IgnorePlugin({
      resourceRegExp: /Inspector/,
      contextRegExp: /react-native/,
    }),
    new webpack.IgnorePlugin({
      resourceRegExp: /^\.\/Inspector$/,
    })
  );

  // Add a fallback for any remaining Inspector imports only
  config.resolve.fallback = {
    ...config.resolve.fallback,
    'Inspector': false,
    'react-native/Libraries/Image/AssetRegistry': path.resolve(__dirname, 'web-asset-registry-shim.js'),
  };

  return config;
};