/**
 * 运行环境检测
 */

/** 是否为微信小程序环境 */
export const isWeapp = process.env.TARO_ENV === 'weapp';

/** 是否为 H5 环境 */
export const isH5 = process.env.TARO_ENV === 'h5';

/** 是否为 iOS */
export const isIOS = (() => {
  if (typeof navigator === 'undefined') return false;
  return /iPhone|iPad|iPod/i.test(navigator.userAgent);
})();
