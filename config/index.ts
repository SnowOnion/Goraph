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
    // PWA 资源（manifest、service worker、图标）原样复制到产物根目录
    patterns: [{ from: 'public/', to: 'dist/' }],
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
    // 生产构建用相对路径，产物可部署在任意子路径（如 /goraph/）；路由是 hash 模式，页面 path 不变。
    // dev server（--watch）用相对路径会白屏，保持 '/'。
    publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
    staticDirectory: 'static',
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
