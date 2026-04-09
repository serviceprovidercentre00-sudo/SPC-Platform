module.exports = function (api) {
  api.cache(true);
  return {
    presets: [
      ["babel-preset-expo", { jsxImportSource: "nativewind" }] // Agar NativeWind use kar rahe hain toh
    ],
    plugins: [
      // REQUIRED: Expo Router ke liye ye hona hi chahiye
    ],
  };
};