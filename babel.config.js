module.exports = function (api) {
  api.cache(true);
  return {
    presets: ['babel-preset-expo'],
    plugins: [
      // Order dhyan se: Worklets hamesha Reanimated se PEHLE aayega
      'react-native-worklets-core/plugin', 
      'react-native-reanimated/plugin',
    ],
  };
};