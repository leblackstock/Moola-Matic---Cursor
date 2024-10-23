import path from 'path';
import webpack from 'webpack';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getConfig = async () => {
  return {
    resolve: {
      fallback: {
        util: (await import('util/')).default,
        os: (await import('os-browserify/browser')).default,
        path: (await import('path-browserify')).default,
        zlib: (await import('browserify-zlib')).default,
        http: (await import('stream-http')).default,
        https: (await import('https-browserify')).default,
        stream: (await import('stream-browserify')).default,
        buffer: (await import('buffer/')).default,
        fs: false,
      },
    },
    devServer: {
      static: {
        directory: path.join(__dirname, 'public'),
      },
      compress: true,
      port: 3000,
      hot: true,
      open: true,
      historyApiFallback: true,
      setupMiddlewares: (middlewares, devServer) => {
        if (!devServer) {
          throw new Error('webpack-dev-server is not defined');
        }
        return middlewares;
      },
    },
    plugins: [
      new webpack.ProvidePlugin({
        Buffer: ['buffer', 'Buffer'],
        process: 'process/browser',
      }),
    ],
  };
};

export default getConfig();
