import axios from "axios";

const host=window.location.hostname;
const port=3001;
const url=`http://${host}:${port}/api`;
const api = axios.create({
  baseURL: url,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 設定請求攔截器
api.interceptors.request.use(
  (config) => {
    // 從 localStorage 讀取 Token
    // !! 重點：這裡的 Key 必須和你登入時存的 "admin_token" 完全一樣 !!
    const token = localStorage.getItem("admin_token");

    // 如果 Token 存在，就把它加到 Authorization Header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // 回傳設定好的 config
  },
  (error) => {
    // 處理請求錯誤
    return Promise.reject(error);
  }
);

export default api;