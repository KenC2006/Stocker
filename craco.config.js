const webpack = require("webpack");

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          url: false,
          crypto: require.resolve("crypto-browserify"),
          stream: require.resolve("stream-browserify"),
          buffer: require.resolve("buffer/"),
          util: require.resolve("util/"),
          assert: require.resolve("assert/"),
          process: require.resolve("process/browser.js"),
        },
      },
    },
    plugins: {
      add: [
        new webpack.ProvidePlugin({
          process: "process/browser.js",
          Buffer: ["buffer", "Buffer"],
        }),
      ],
    },
  },
};
