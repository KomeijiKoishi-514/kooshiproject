// src/components/FlowErrorBoundary.js

import React from 'react';

class FlowErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    // 檢查是否是我們要忽略的特定錯誤
    if (error.message && error.message.includes("ResizeObserver loop completed")) {
      // "捕捉" 它，並更新 state
      return { hasError: true, error: error };
    }
    // 對於任何其他錯誤，正常顯示錯誤
    return { hasError: true, error: error };
  }

  componentDidCatch(error, errorInfo) {
    // 以只上報「非」ResizeObserver 的錯誤
    if (!error.message.includes("ResizeObserver loop completed")) {
      console.error("Error Boundary 捕捉到錯誤:", error, errorInfo);
    }
    // 對於 ResizeObserver 錯誤，我們什麼都不做 (保持安靜)
  }

  render() {
    // 如果是 ResizeObserver 錯誤就裝做沒事
    // 仍然渲染子元件 (this.props.children)
    if (this.state.hasError && this.state.error.message.includes("ResizeObserver loop completed")) {
      return this.props.children;
    }

    // 如果是 "其他" 錯誤，才顯示錯誤訊息
    if (this.state.hasError) {
      return (
        <div className="p-4 bg-red-100 text-red-700 rounded m-4">
          <h1>學程地圖載入錯誤</h1>
          <p>{this.state.error.message}</p>
        </div>
      );
    }

    // 正常情況下，渲染子元件
    return this.props.children;
  }
}

export default FlowErrorBoundary;