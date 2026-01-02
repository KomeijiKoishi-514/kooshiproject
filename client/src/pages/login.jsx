import React, { useState } from "react";
import api from '../api/axiosConfig';
import { useNavigate, Link } from "react-router-dom";
import { AcademicCapIcon } from "@heroicons/react/24/solid";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const res = await api.post("/auth/login", { username, password });
      const { token, user } = res.data;

      if (!token) {
          throw new Error("伺服器未回傳 Token");
      }

      localStorage.setItem("auth_token", token);
      localStorage.setItem("user_info", JSON.stringify(user));

      if (user.role === 'admin') {
        console.log("管理員登入，前往後台");
        nav("/admin");
      } else {
        console.log("學生/使用者登入，前往首頁");
        nav("/curriculum"); 
      }

    } catch (err) {
      console.error("登入錯誤:", err);
      setError(err.response?.data?.message || "登入失敗，請檢查帳號密碼或伺服器狀態。");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-sky-100 via-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white/80 backdrop-blur-sm p-10 rounded-3xl shadow-2xl border border-white/50">
        
        {/* Logo 與標題區 */}
        <div className="text-center">
          <div className="mx-auto h-20 w-20 bg-blue-600 rounded-full flex items-center justify-center shadow-lg transform hover:scale-105 transition-transform duration-300">
             <AcademicCapIcon className="h-12 w-12 text-white" />
          </div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900 tracking-tight">
            學程地圖系統
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            歡迎回來，請輸入您的帳號密碼
          </p>
        </div>
        
        <form className="mt-8 space-y-6" onSubmit={submit}>
          
          {/* 錯誤訊息顯示區 */}
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 p-4 rounded-md animate-pulse">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-500" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <p className="text-sm font-medium text-red-800">{error}</p>
                </div>
              </div>
            </div>
          )}

          <div className="space-y-5">
            {/* 帳號輸入框 */}
            <div>
              <label htmlFor="username" className="block text-sm font-medium text-gray-700 mb-1">
                帳號 (學號/管理員)
              </label>
              <input
                id="username"
                name="username"
                type="text"
                required
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="請輸入您的帳號"
                value={username}
                onChange={e => setUsername(e.target.value)}
                disabled={loading}
              />
            </div>

            {/* 密碼輸入框 */}
            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                密碼
              </label>
              <input
                id="password"
                name="password"
                type="password"
                required
                className="appearance-none block w-full px-4 py-3 border border-gray-300 rounded-xl placeholder-gray-400 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                placeholder="請輸入您的密碼"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={loading}
              />
            </div>
          </div>

          {/* 忘記密碼連結 */}
          <div className="flex items-center justify-end">
            <div className="text-sm">
              <Link 
                to="/forgot-password" 
                className="font-medium text-blue-600 hover:text-blue-500 transition-colors duration-200 hover:underline"
              >
                忘記密碼？
              </Link>
            </div>
          </div>

          {/* 登入按鈕 */}
          <div>
            <button
              type="submit"
              disabled={loading}
              className={`group relative w-full flex justify-center py-3.5 px-4 border border-transparent text-sm font-bold rounded-xl text-white transition-all duration-200 ease-in-out transform hover:-translate-y-0.5 hover:shadow-lg
                ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"}`}
            >
              {loading && (
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              )}
              {loading ? "正在登入..." : "登入系統"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}