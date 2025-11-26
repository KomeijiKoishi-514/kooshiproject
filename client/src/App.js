// import React from "react"; // ProtectedRoute 不需要
//  主頁面配置用
import React, { useState } from "react";
import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

// 引入你的頁面
import AdminPage from "./pages/adminpage";
import CurriculumMap from "./pages/curriculummap";
import Login from "./pages/login";

// 側邊攔
import Sidebar from "./components/Sidebar";

function ProtectedRoute({ element: Element }) {
  const token = localStorage.getItem("admin_token");
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return <Element />;
}

export default function App() {
  // 建立 isCollapsed 狀態(初始收合)
  const [isCollapsed, setIsCollapsed] = useState(true);
  // 建立一個切換函式
  const toggleSidebar = () => {
    setIsCollapsed(!isCollapsed);
  };

  return (
    <Router>
      <div className="flex flex-row h-screen bg-gray-100">
        {/* 將狀態和函式作為 props 傳遞給 Sidebar */}
        <Sidebar isCollapsed={isCollapsed} toggleSidebar={toggleSidebar} />
        {/*           Main 區域不需改動
          "flex-1" 會自動填滿 Sidebar 縮小後多出來的空間
        */}
        <main className="flex-1 overflow-y-auto">
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/admin"
              element={<ProtectedRoute element={AdminPage} />}
            />
            <Route path="/curriculum" element={<CurriculumMap />} />
            <Route path="*" element={<Navigate to="/curriculum" replace />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}