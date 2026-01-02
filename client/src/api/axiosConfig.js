import axios from "axios";

const host=window.location.hostname;
const port=3001;
//const url=`https://my-super-project-api.loca.lt`;
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
    const token = localStorage.getItem("auth_token");

    // 如果 Token 存在，就把它加到 Authorization Header
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config; // 回傳設定好的 config
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;