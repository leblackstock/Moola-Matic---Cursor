const path = require('path');

module.exports = {
  // ... other configurations ...
  resolve: {
    fallback: {
      util: require.resolve('util/'),
      os: require.resolve('os-browserify/browser'),
      path: require.resolve('path-browserify'),
      zlib: require.resolve('browserify-zlib'),
      http: require.resolve('stream-http'),
      https: require.resolve('https-browserify'),
      fs: false,
    },
  },
  // ... other configurations ...
};
