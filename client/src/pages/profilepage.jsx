// client/src/pages/ProfilePage.jsx
import React, { useState, useEffect } from "react";
import api from "../api/axiosConfig";
// 引入圖標，新增 LockClosedIcon 和 KeyIcon
import { 
  UserCircleIcon, 
  IdentificationIcon, 
  EnvelopeIcon, 
  BuildingLibraryIcon,
  LockClosedIcon, 
  KeyIcon 
} from "@heroicons/react/24/outline";

export default function ProfilePage() {
  // ==========================================
  // 1. 狀態定義 (State Definitions)
  // ==========================================
  
  // --- A. 基本資料表單狀態 ---
  const [formData, setFormData] = useState({
    username: "",
    full_name: "",
    email: "",
    dept_id: "",
    role: "",
  });
  const [loadingData, setLoadingData] = useState(true);
  const [submittingProfile, setSubmittingProfile] = useState(false); // 更名以區分
  const [profileMessage, setProfileMessage] = useState({ type: "", content: "" }); // 更名以區分

  // --- B. 🔥 修改密碼表單狀態 (新增) ---
  const [passwordData, setPasswordData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [submittingPassword, setSubmittingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState({ type: "", content: "" });


  // ==========================================
  // 2. 副作用：載入使用者資料
  // ==========================================
  useEffect(() => {
    fetchProfileData();
  }, []);

  const fetchProfileData = async () => {
    setLoadingData(true);
    try {
      const res = await api.get("/user/profile");
      const data = res.data;
      setFormData({
        username: data.username,
        full_name: data.full_name,
        email: data.email || "",
        dept_id: data.dept_id || "",
        role: data.role,
      });
    } catch (err) {
      console.error("無法載入個人資料:", err);
      setProfileMessage({ type: "error", content: "無法載入個人資料，請稍後再試。" });
    } finally {
      setLoadingData(false);
    }
  };

  // ==========================================
  // 3. 事件處理 (Event Handlers)
  // ==========================================

  // --- A. 基本資料表單處理 ---
  const handleProfileChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (profileMessage.content) setProfileMessage({ type: "", content: "" });
  };

  const handleProfileSubmit = async (e) => {
    e.preventDefault();
    setSubmittingProfile(true);
    setProfileMessage({ type: "", content: "" });

    try {
      const payload = {
          username: formData.username,
          full_name: formData.full_name,
          email: formData.email,
          ...(formData.role === 'student' && { dept_id: formData.dept_id || null })
      };
      const res = await api.put("/user/profile", payload);
      setProfileMessage({ type: "success", content: "個人資料更新成功！" });

      // 同步更新 Local Storage
      const currentUserInfo = JSON.parse(localStorage.getItem("user_info") || "{}");
      const newUserInfo = { ...currentUserInfo, ...res.data.user };
      localStorage.setItem("user_info", JSON.stringify(newUserInfo));

    } catch (err) {
      console.error("更新失敗:", err);
      setProfileMessage({ type: "error", content: err.response?.data?.message || "更新失敗，請檢查輸入資料。" });
    } finally {
      setSubmittingProfile(false);
    }
  };

  // --- B. 🔥 修改密碼表單處理 (新增) ---
  const handlePasswordChange = (e) => {
    setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
    // 清除之前的訊息
    if (passwordMessage.content) setPasswordMessage({ type: "", content: "" });
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();

    // 前端驗證：檢查兩次密碼是否輸入一致
    if (passwordData.newPassword !== passwordData.confirmPassword) {
        setPasswordMessage({ type: "error", content: "新密碼與確認密碼不相符！" });
        return;
    }

    // 前端驗證：檢查密碼長度 (可選，後端也有檢查)
    if (passwordData.newPassword.length < 6) {
        setPasswordMessage({ type: "error", content: "新密碼長度至少需 6 個字元。" });
        return;
    }

    setSubmittingPassword(true);
    setPasswordMessage({ type: "", content: "" });

    try {
      // 呼叫後端 API
      await api.put("/user/change-password", {
          currentPassword: passwordData.currentPassword,
          newPassword: passwordData.newPassword
      });
      
      setPasswordMessage({ type: "success", content: "密碼修改成功！下次請使用新密碼登入。" });
      // 成功後清空密碼輸入框，避免重複送出
      setPasswordData({ currentPassword: "", newPassword: "", confirmPassword: "" });

    } catch (err) {
      console.error("修改密碼失敗:", err);
      // 顯示錯誤訊息 (例如：目前密碼輸入錯誤)
      setPasswordMessage({ type: "error", content: err.response?.data?.message || "密碼修改失敗，請稍後再試。" });
    } finally {
      setSubmittingPassword(false);
    }
  };


  // ==========================================
  // 4. Render 介面
  // ==========================================
  if (loadingData) {
    return <div className="p-8 text-center text-gray-500 flex justify-center items-center"><svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>正在載入個人資料...</div>;
  }

  return (
    <div className="p-6 max-w-4xl mx-auto pb-20"> {/* 增加底部 padding 避免貼底 */}
      <h1 className="text-3xl font-bold text-gray-800 mb-8 flex items-center">
        <UserCircleIcon className="h-10 w-10 mr-3 text-blue-600" />
        個人檔案管理
      </h1>

      {/* ========================================== */}
      {/* 區塊 1: 基本資料設定 (保持不變，變數名稱微調) */}
      {/* ========================================== */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden mb-10">
        <div className="bg-gray-50 px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-700">基本資料設定</h2>
          <p className="text-sm text-gray-500 mt-1">管理您的帳號資訊、姓名與聯絡方式。</p>
        </div>

        {profileMessage.content && (
          <div className={`px-6 py-3 ${profileMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {profileMessage.content}
          </div>
        )}

        <form onSubmit={handleProfileSubmit} className="p-6 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <IdentificationIcon className="h-4 w-4 mr-1 inline" /> 使用者名稱 (帳號)
              </label>
              <input
                type="text"
                name="username"
                required
                value={formData.username}
                onChange={handleProfileChange}
                // 如果角色不是 admin，就禁用此輸入框
                disabled={formData.role !== 'admin'}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition
                  ${formData.role !== 'admin' ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`} // 加上禁用時的樣式
              />
              {formData.role !== 'admin' && (
                <p className="text-xs text-gray-500 mt-1">如需修改此欄位，請聯繫管理員。</p>
              )}
              <p className="text-xs text-gray-500 mt-1">這是您登入時使用的帳號。</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <UserCircleIcon className="h-4 w-4 mr-1 inline" /> 預覽名稱
              </label>
              <input
                type="text"
                name="full_name"
                required
                value={formData.full_name}
                onChange={handleProfileChange}
                // 如果角色不是 admin，就禁用此輸入框
                disabled={formData.role !== 'admin'}
                className={`w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition
                  ${formData.role !== 'admin' ? 'bg-gray-100 cursor-not-allowed text-gray-500' : ''}`} // 加上禁用時的樣式
              />
              {formData.role !== 'admin' && (
                <p className="text-xs text-gray-500 mt-1">如需修改此欄位，請聯繫管理員。</p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <EnvelopeIcon className="h-4 w-4 mr-1 inline" /> 電子郵件
              </label>
              <input
                type="email"
                name="email"
                required
                value={formData.email}
                onChange={handleProfileChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
              />
              <p className="text-xs text-gray-500 mt-1">用於接收重要通知與重設密碼，請確保正確。</p>
            </div>

            {formData.role === 'student' && (
               <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100">
                <label className="block text-sm font-medium text-blue-800 mb-1 flex items-center">
                  <BuildingLibraryIcon className="h-4 w-4 mr-1 inline" /> 所屬系所代碼 (學生專用)
                </label>
                <input
                  type="number"
                  name="dept_id"
                  value={formData.dept_id}
                  onChange={handleProfileChange}
                  placeholder="例如: 510"
                  className="w-full p-3 border border-blue-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition bg-white"
                />
                <p className="text-xs text-blue-600 mt-1">請輸入您的系所代碼 (例如：資通系為 510)。</p>
              </div>
            )}
          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={submittingProfile}
              className={`px-6 py-3 rounded-lg text-white font-medium shadow-sm transition-all flex items-center
                ${submittingProfile 
                  ? "bg-blue-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700 hover:shadow-md active:transform active:scale-95"}`}
            >
              {submittingProfile ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  儲存中...
                </>
              ) : "儲存基本資料"}
            </button>
          </div>
        </form>
      </div>
      
      {/* ========================================== */}
      {/* 區塊 2: 🔥 修改密碼 (新增區塊) */}
      {/* ========================================== */}
      <div className="bg-white rounded-2xl shadow-xl overflow-hidden border border-red-100">
        <div className="bg-red-50 px-6 py-4 border-b border-red-100 flex items-center">
          <LockClosedIcon className="h-6 w-6 text-red-600 mr-2" />
          <div>
            <h2 className="text-xl font-semibold text-gray-800">安全性設定</h2>
            <p className="text-sm text-red-600 mt-1">建議定期更換您的密碼以提升帳戶安全。</p>
          </div>
        </div>

        {passwordMessage.content && (
          <div className={`px-6 py-3 ${passwordMessage.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'}`}>
            {passwordMessage.content}
          </div>
        )}

        <form onSubmit={handlePasswordSubmit} className="p-6 space-y-6">
          <div className="space-y-4 max-w-lg">
            
            {/* 目前密碼 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <KeyIcon className="h-4 w-4 mr-1 inline text-gray-500" /> 目前密碼
              </label>
              <input
                type="password"
                name="currentPassword"
                required
                value={passwordData.currentPassword}
                onChange={handlePasswordChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                placeholder="請輸入您現在使用的密碼"
              />
            </div>

            {/* 新密碼 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <LockClosedIcon className="h-4 w-4 mr-1 inline text-gray-500" /> 新密碼
              </label>
              <input
                type="password"
                name="newPassword"
                required
                minLength={6}
                value={passwordData.newPassword}
                onChange={handlePasswordChange}
                className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 transition"
                placeholder="請輸入新密碼 (至少 6 碼)"
              />
            </div>

            {/* 確認新密碼 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1 flex items-center">
                <LockClosedIcon className="h-4 w-4 mr-1 inline text-gray-500" /> 確認新密碼
              </label>
              <input
                type="password"
                name="confirmPassword"
                required
                minLength={6}
                value={passwordData.confirmPassword}
                onChange={handlePasswordChange}
                className={`w-full p-3 border rounded-lg focus:ring-2 transition
                  ${passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword 
                    ? 'border-red-500 focus:ring-red-500 focus:border-red-500' // 不匹配時顯示紅色
                    : 'border-gray-300 focus:ring-red-500 focus:border-red-500'}`}
                placeholder="請再次輸入新密碼"
              />
              {/* 即時提示密碼不匹配 */}
              {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                <p className="text-xs text-red-600 mt-1">確認密碼與新密碼不相符。</p>
              )}
            </div>

          </div>

          <div className="flex justify-end pt-4 border-t border-gray-100">
            <button
              type="submit"
              disabled={submittingPassword || (passwordData.newPassword !== passwordData.confirmPassword)}
              className={`px-6 py-3 rounded-lg text-white font-medium shadow-sm transition-all flex items-center
                ${submittingPassword || (passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword)
                  ? "bg-red-300 cursor-not-allowed" 
                  : "bg-red-600 hover:bg-red-700 hover:shadow-md active:transform active:scale-95"}`}
            >
              {submittingPassword ? (
                <>
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>
                  處理中...
                </>
              ) : "修改密碼"}
            </button>
          </div>
        </form>
      </div>

    </div>
  );
}