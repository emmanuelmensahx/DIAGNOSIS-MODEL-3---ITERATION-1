const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Add web-specific resolver configuration
config.resolver.platforms = ['web', 'native', 'ios', 'android'];

// Resolve React Native web compatibility issues
config.resolver.alias = {
  'react-native': 'react-native-web',
};

// Add resolver for missing platform utilities
config.resolver.resolverMainFields = ['browser', 'main'];

module.exports = config;