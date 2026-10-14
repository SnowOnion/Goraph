/**
 * 跨平台 Text 组件
 * 解决 Taro <Text> 在 React 18 下的 "Text constructor: 'new' is required" 问题
 * H5 模式下使用 <span>，小程序模式下可切换为 Taro <Text>
 */
import React from 'react';

interface TextProps {
  children?: React.ReactNode;
  style?: React.CSSProperties;
  className?: string;
  onClick?: (e: any) => void;
  selectable?: boolean;
}

export function Text({ children, style, className, onClick }: TextProps) {
  return (
    <span
      style={{ ...style, display: 'inline' }}
      className={className}
      onClick={onClick}
    >
      {children}
    </span>
  );
}
