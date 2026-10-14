/**
 * 跨平台存储封装
 * H5 使用 localStorage，小程序使用 Taro 存储
 */

import Taro from '@tarojs/taro';

const BOARDS_KEY = 'goraph-boards';

/** 获取所有自定义棋盘 */
export function getSavedBoards(): Record<string, any> {
  try {
    if (process.env.TARO_ENV === 'weapp') {
      return Taro.getStorageSync(BOARDS_KEY) || {};
    }
    const json = localStorage.getItem(BOARDS_KEY);
    return json ? JSON.parse(json) : {};
  } catch {
    return {};
  }
}

/** 保存棋盘 */
export function saveBoard(name: string, data: any): void {
  try {
    const boards = getSavedBoards();
    boards[name] = data;
    if (process.env.TARO_ENV === 'weapp') {
      Taro.setStorageSync(BOARDS_KEY, boards);
    } else {
      localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
    }
  } catch (e) {
    console.warn('saveBoard failed:', e);
  }
}

/** 删除棋盘 */
export function deleteBoard(name: string): void {
  try {
    const boards = getSavedBoards();
    delete boards[name];
    if (process.env.TARO_ENV === 'weapp') {
      Taro.setStorageSync(BOARDS_KEY, boards);
    } else {
      localStorage.setItem(BOARDS_KEY, JSON.stringify(boards));
    }
  } catch (e) {
    console.warn('deleteBoard failed:', e);
  }
}

/** 获取已保存棋盘名称列表 */
export function getSavedBoardNames(): string[] {
  return Object.keys(getSavedBoards());
}
