  // client/src/App.js
  import React, { useState } from "react";
  import {
    BrowserRouter as Router,
    Routes,
    Route,
    Navigate,
  } from "react-router-dom";
import { ChevronLeftIcon, ChevronRightIcon } from "@heroicons/react/24/outline";

// 引入頁面
import HomePage from "./pages/homepage";
import AdminPage from "./pages/adminpage";
import AdminUsersPage from "./pages/adminuserpage";
import CoursePlanningPage from "./pages/courseplanningpage";
import CurriculumMap from "./pages/curriculummap";
import Login from "./pages/login";
import ForgotPasswordPage from "./pages/forgotpasswordpage";
import ProfilePage from "./pages/profilepage";
import ResetPasswordPage from "./pages/resetpasswordpage";
import ExportPreviewPage from "./pages/exportpreviewpage";
// 側邊攔
import Sidebar from "./components/Sidebar";
import { Toaster } from 'react-hot-toast'

// =====================================================================
// 路由保護元件 1：一般受保護路由 (ProtectedRoute)
// 只檢查是否已登入。適用於所有使用者都能訪問的私人頁面 (如個人檔案)。
// =====================================================================
function ProtectedRoute({ element: Element }) {
  // 檢查是否有 Token 和使用者資訊
  const token = localStorage.getItem("auth_token");
  const userInfoStr = localStorage.getItem("user_info");

  // 如果沒登入，踢回登入頁
  if (!token || !userInfoStr) {
    return <Navigate to="/login" replace />;
  }

  // 已登入，放行
  return <Element />;
}

// =====================================================================
// 路由保護元件 2：管理員專屬路由 (AdminRoute)
// 用途：檢查是否已登入，且角色必須是 'admin'。適用於後台管理頁面。
// =====================================================================
function AdminRoute({ element: Element }) {
  const token = localStorage.getItem("auth_token");
  const userInfoStr = localStorage.getItem("user_info");

  // 1. 先檢查是否登入
  if (!token || !userInfoStr) {
    return <Navigate to="/login" replace />;
  }

  try {
    const user = JSON.parse(userInfoStr);
    // 2. 再檢查角色權限
    // 如果不是管理員，踢回學生的首頁 (學程地圖)
    if (user.role !== 'admin') {
       console.warn("非管理員嘗試訪問後台，已攔截。");
       return <Navigate to="/curriculum" replace />;
    }
  } catch (e) {
    // 資料異常，清除並踢回登入頁
    localStorage.clear();
    return <Navigate to="/login" replace />;
  }

  // 驗證通過，是管理員，放行
  return <Element />;
}


// =====================================================================
// 主應用元件 (App)
// =====================================================================
export default function App() {
  //  初始收縮
  const [isCollapsed, setIsCollapsed] = useState(true);
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Router>
      <div className="flex flex-row h-screen bg-gray-100 relative overflow-hidden">
        
        {/* 🔥 2. 在這裡放入 Toaster 元件 */}
        {/* 我們可以設定一些預設樣式，讓它看起來更現代 */}
        <Toaster
          position="top-center" // 設定出現位置：上方置中
          reverseOrder={false}
          gutter={8} // toast 之間的間距
          toastOptions={{
            // 設定預設樣式
            duration: 3000, // 3秒後自動消失
            style: {
              background: '#363636',
              color: '#fff',
              borderRadius: '10px',
              padding: '16px',
              boxShadow: '0 4px 12px rgba(0, 0, 0, 0.15)',
            },
            // 針對成功訊息的特定樣式
            success: {
              style: {
                background: '#10B981', // Tailwind 的 green-500
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#10B981',
              },
            },
            // 針對錯誤訊息的特定樣式
            error: {
              style: {
                background: '#EF4444', // Tailwind 的 red-500
              },
              iconTheme: {
                primary: '#fff',
                secondary: '#EF4444',
              },
            },
          }}
        />
        
        {/* 側邊欄元件 (現在裡面沒有按鈕了) */}
        <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />

        {/* 增懸浮收縮按鈕 */}
        <button
          onClick={toggleSidebar}
          aria-label="切換側邊欄"
          // Tailwind CSS 樣式解析：
          // absolute: 絕對定位
          // top-1/2 -translate-y-1/2: 垂直置中
          // z-50: 確保層級最高，浮在內容上方
          // left-20 / left-64: 根據側邊欄寬度決定水平位置
          // -ml-4: 向左偏移 1rem (約半個按鈕寬度)，讓按鈕剛好「跨」在邊線上 shadow-[0_0_10px_rgba(0,0,0,0.1)]
          className={`absolute top-1/2 -translate-y-1/2 z-50 p-1.5 bg-blue-600 text-white rounded-full border border-blue-600 hover:bg-blue-50 hover:text-blue-700 transition-all duration-300 ease-in-out
            ${isCollapsed ? 'left-20 -ml-3' : 'left-64 -ml-3'}`}
        >
          {/* 根據狀態顯示對應箭頭 */}
          {isCollapsed ? (
            <ChevronRightIcon className="h-5 w-5" />
          ) : (
            <ChevronLeftIcon className="h-5 w-5" />
          )}
        </button>

        {/* 主內容區域 */}
        <main className="flex-1 overflow-y-auto relative z-0">
          <Routes>
             {/* ... (路由設定保持不變) ... */}
             <Route path="/" element={<HomePage />} />
             <Route path="/login" element={<Login />} />
             <Route path="/forgot-password" element={<ForgotPasswordPage />} />
             <Route path="/curriculum" element={<CurriculumMap />} />
             <Route path="/profile" element={<ProtectedRoute element={ProfilePage} />} />
             <Route path="/admin" element={<AdminRoute element={AdminPage} />} />
             <Route path="/adminuser" element={<AdminRoute element={AdminUsersPage} />}/>
             <Route path="/reset-password/:token" element={<ResetPasswordPage />} />
             <Route path="/planning" element={<ProtectedRoute element={CoursePlanningPage} />}/>
             <Route path="/curriculum/export/:deptId" element={<ExportPreviewPage />} />
             <Route path="*" element={<Navigate to="/curriculum" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}