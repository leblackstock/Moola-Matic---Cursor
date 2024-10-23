// root/config-overrides.js
// @ts-nocheck

/* eslint-disable no-undef */
/* eslint-disable import/no-commonjs */
/* eslint-env node */

const overrideConfig = {
  webpack: config => config,
  devServer: configFunction => (proxy, allowedHost) => {
    const config = configFunction(proxy, allowedHost);

    delete config.onBeforeSetupMiddleware;
    delete config.onAfterSetupMiddleware;

    config.setupMiddlewares = (middlewares, devServer) => {
      if (!devServer) {
        throw new Error('webpack-dev-server is not defined');
      }
      return middlewares;
    };

    return config;
  },
};

module.exports = overrideConfig;
