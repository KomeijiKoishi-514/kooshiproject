// client/src/pages/ResetPasswordPage.jsx
import React, { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom'; // 引入 useParams 來抓網址參數
import api from '../api/axiosConfig';
import { LockClosedIcon, KeyIcon } from "@heroicons/react/24/outline";

export default function ResetPasswordPage() {
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [message, setMessage] = useState({ type: '', content: '' });
  const [loading, setLoading] = useState(false);
  
  const nav = useNavigate();
  // 🔥 關鍵：從網址中抓取 token 參數 (/reset-password/:token)
  const { token } = useParams();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMessage({ type: '', content: '' });

    // 前端驗證
    if (password !== confirmPassword) {
        setMessage({ type: 'error', content: '兩次輸入的密碼不一致！' });
        return;
    }
    if (password.length < 6) {
        setMessage({ type: 'error', content: '新密碼長度至少需 6 個字元。' });
        return;
    }

    setLoading(true);

    try {
      // 🔥 呼叫後端 API，把 token 帶在網址上，新密碼帶在 body 裡
      const res = await api.post(`/auth/reset-password/${token}`, { password });
      
      // 成功：顯示訊息，並在 3 秒後跳轉回登入頁
      setMessage({ type: 'success', content: res.data.message });
      setTimeout(() => {
          nav('/login');
      }, 3000);

    } catch (err) {
      console.error("重設密碼失敗:", err);
      // 失敗：顯示錯誤訊息 (例如連結過期)
      setMessage({ type: 'error', content: err.response?.data?.message || '重設失敗，請稍後再試或重新申請。' });
    } finally {
      setLoading(false);
    }
  };

  // 如果網址沒有 token，直接顯示錯誤 (防止使用者直接拜訪 /reset-password)
  if (!token) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-100">
            <div className="bg-white p-8 rounded-lg shadow-md text-red-600">
                無效的連結。請檢查您的信件。
            </div>
        </div>
      );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-2xl shadow-xl">
        
        <div className="text-center">
          <LockClosedIcon className="mx-auto h-12 w-12 text-blue-600" />
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            設定新密碼
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            請輸入您的新密碼以完成重設流程。
          </p>
        </div>

        {/* 訊息提示區塊 */}
        {message.content && (
          <div className={`p-4 rounded-md ${message.type === 'success' ? 'bg-green-50 text-green-700 border-l-4 border-green-400' : 'bg-red-50 text-red-700 border-l-4 border-red-400'}`}>
            <p className="text-sm">{message.content}</p>
          </div>
        )}

        {/* 如果成功了，就隱藏表單，只顯示成功訊息並等待跳轉 */}
        {message.type !== 'success' && (
            <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
            <div className="space-y-4">
                <div>
                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <KeyIcon className="h-4 w-4 mr-1 inline text-gray-500" /> 新密碼
                    </label>
                    <input
                        id="password"
                        name="password"
                        type="password"
                        required
                        minLength={6}
                        className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="至少 6 個字元"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                    />
                </div>
                <div>
                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                        <KeyIcon className="h-4 w-4 mr-1 inline text-gray-500" /> 確認新密碼
                    </label>
                    <input
                        id="confirmPassword"
                        name="confirmPassword"
                        type="password"
                        required
                        minLength={6}
                        className="appearance-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                        placeholder="請再次輸入新密碼"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                    />
                </div>
            </div>

            <div>
                <button
                type="submit"
                disabled={loading}
                className={`group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white transition-colors
                    ${loading ? "bg-blue-400 cursor-not-allowed" : "bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"}`}
                >
                {loading ? "處理中..." : "確認重設密碼"}
                </button>
            </div>
            </form>
        )}
      </div>
    </div>
  );
}