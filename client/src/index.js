import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App';

// 這是正確的 import
// 確保這個路徑指向你在步驟一中的 CSS 檔案
import './index.css'; 

// 修正 ResizeObserver 警告
const observerErr = window.ResizeObserver && window.ResizeObserver;
if (observerErr) {
  const originalError = console.error;
  console.error = (...args) => {
    if (args[0]?.includes?.("ResizeObserver")) return;
    originalError(...args);
  };
}
// ResizeObserver 的警告（ReactFlow已知bug）
const ignoreResizeObserverError = (message) =>
  message?.includes?.("ResizeObserver loop completed");

const originalError = console.error;
console.error = (...args) => {
  if (ignoreResizeObserverError(args[0])) return; // 忽略 ResizeObserver 錯誤
  originalError(...args);
};

const root = ReactDOM.createRoot(document.getElementById('root'));
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);