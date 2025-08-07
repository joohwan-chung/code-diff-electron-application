const webpack = require('webpack');

module.exports = {
  webpack: {
    configure: {
      resolve: {
        fallback: {
          path: require.resolve('path-browserify'),
          fs: false,
          crypto: false,
          stream: false,
          util: false,
          buffer: false,
          process: false,
        },
      },
      plugins: [
        new webpack.DefinePlugin({
          'process.env.NODE_ENV': JSON.stringify(process.env.NODE_ENV),
        }),
      ],
    },
  },
};
