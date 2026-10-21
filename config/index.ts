const path = require('path');

const config = {
  projectName: 'goraph',
  date: '2024-01-01',
  designWidth: 750,
  deviceRatio: {
    640: 2.34 / 2,
    750: 1,
    828: 1.81 / 2,
  },
  sourceRoot: 'src',
  outputPath: 'dist',
  outputRoot: 'dist',
  plugins: [],
  defineConstants: {},
  alias: {
    '@': path.resolve(__dirname, '..', 'src'),
  },
  copy: {
    patterns: [
      { from: 'src/static/manifest.json', to: 'manifest.json' },
      { from: 'src/static/sw.js', to: 'sw.js' },
      { from: 'src/static/icons', to: 'icons' },
    ],
    options: {},
  },
  framework: 'react',
  compiler: {
    type: 'webpack5',
    prebundle: {
      enable: false,
    },
  },
  cache: {
    enable: true,
  },
  mini: {
    postcss: {
      pxtransform: {
        enable: true,
        config: {},
      },
      cssModules: {
        enable: false,
      },
    },
  },
  h5: {
    publicPath: '/',
    staticDirectory: 'static',
    staticPublicPath: '/',
    output: {
      filename: 'js/[name].[hash:8].js',
      chunkFilename: 'js/[name].[hash:8].chunk.js',
    },
    miniCssExtractPluginOption: {
      filename: 'css/[name].[hash:8].css',
      chunkFilename: 'css/[name].[hash:8].chunk.css',
    },
    postcss: {
      autoprefixer: {
        enable: true,
        config: {},
      },
      pxtransform: {
        enable: false,
      },
      cssModules: {
        enable: false,
      },
    },
  },
};

module.exports = config;
