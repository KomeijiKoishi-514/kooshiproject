/*=====================================================
   SIDE BAR (使用 Heroicons 美化版)
=====================================================*/

import React from "react";
import { Link, useNavigate } from "react-router-dom";
// 1. 引入需要的 Heroicons (Outline 風格)
import { 
  MapIcon, 
  Cog6ToothIcon, 
  KeyIcon, 
  ArrowLeftOnRectangleIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  AcademicCapIcon // 用來暫代 Logo
} from "@heroicons/react/24/outline";

export default function Sidebar({ isCollapsed, toggleSidebar }) {
  const nav = useNavigate();
  //  確認登入狀態
  const logout = () => {
    localStorage.removeItem("admin_token");
    nav("/login");
  };

  const isLoggedIn = !!localStorage.getItem("admin_token");

  // 定義一個通用的 Icon 樣式 class
  const iconClass = "h-6 w-6 flex-shrink-0";

  return (
    <nav
      className={`h-screen bg-blue-600 text-white flex flex-col p-4 shadow-lg flex-shrink-0 
        ${isCollapsed ? "w-20" : "w-64"} transition-all duration-300 ease-in-out overflow-hidden`}
    >
      {/* Logo/標題 */}
      <div
        className={`flex items-center mb-8 p-2 transition-all duration-300 ${
          isCollapsed ? "justify-center" : "space-x-3"
        }`}
      >
        {/* 如果你想繼續用圖片，取消下面這段的註解，並註解掉 AcademicCapIcon
        */}
        {/* <img
          src="/images/USC.png"
          alt="USC"
          className="h-10 w-10 object-contain flex-shrink-0" 
        /> */}
        
        {/* 使用圖標代替 Logo */}
        <AcademicCapIcon className="h-10 w-10 text-yellow-300 flex-shrink-0" />

        <h1
          className={`text-xl font-bold whitespace-nowrap overflow-hidden transition-all duration-300 ${
            isCollapsed ? "w-0 opacity-0" : "w-full opacity-100"
          }`}
        >
          學程地圖系統
        </h1>
      </div>

      {/* 中間的導覽連結 */}
      <div className="flex-1 flex flex-col space-y-4">
        <Link
          to="/curriculum"
          className={`flex items-center p-3 rounded-lg hover:bg-blue-700 hover:text-yellow-300 transition-colors group ${
            isCollapsed ? "justify-center" : "space-x-4"
          }`}
          title={isCollapsed ? "學程地圖" : ""}
        >
          <MapIcon className={iconClass} />
          
          {/* 收入動畫 */}
          <span
            className={`whitespace-nowrap overflow-hidden transition-all duration-300 font-medium ${
              isCollapsed ? "w-0 opacity-0" : "w-full opacity-100"
            }`}
          >
            學程地圖
          </span>
        </Link>

        {isLoggedIn ? (
          <>
            <Link
              to="/admin"
              className={`flex items-center p-3 rounded-lg hover:bg-blue-700 hover:text-yellow-300 transition-colors ${
                isCollapsed ? "justify-center" : "space-x-4"
              }`}
              title={isCollapsed ? "管理系統" : ""}
            >
              <Cog6ToothIcon className={iconClass} />
              <span
                className={`whitespace-nowrap overflow-hidden transition-all duration-300 font-medium ${
                  isCollapsed ? "w-0 opacity-0" : "w-full opacity-100"
                }`}
              >
                管理系統
              </span>
            </Link>
          </>
        ) : (
          <Link
            to="/login"
            className={`flex items-center p-3 rounded-lg hover:bg-blue-700 hover:text-yellow-300 transition-colors ${
              isCollapsed ? "justify-center" : "space-x-4"
            }`}
            title={isCollapsed ? "使用者登入" : ""}
          >
            {/* 替換掉 🔑 */}
            <KeyIcon className={iconClass} />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 font-medium ${
                isCollapsed ? "w-0 opacity-0" : "w-full opacity-100"
              }`}
            >
               使用者登入
            </span>
          </Link>
        )}
      </div>

      <div className="mt-auto mb-4 space-y-2">
        <button
          onClick={toggleSidebar}
          className={`flex items-center w-full p-3 rounded-lg hover:bg-blue-700 transition-colors outline-none ${
            isCollapsed ? "justify-center" : "space-x-4"
          }`}
          title={isCollapsed ? "展開側邊欄" : "收合側邊欄"}
        >
          {isCollapsed ? (
            <ChevronRightIcon className={iconClass} />
          ) : (
            <ChevronLeftIcon className={iconClass} />
          )}
          <span
            className={`whitespace-nowrap overflow-hidden transition-all duration-300 font-medium ${
              isCollapsed ? "w-0 opacity-0" : "w-full opacity-100"
            }`}
          >
            收合側邊欄
          </span>
        </button>

        {isLoggedIn && (
          <button
            onClick={logout}
            className={`flex items-center w-full text-left p-3 rounded-lg bg-blue-800/50 hover:bg-red-500 hover:text-white transition-colors outline-none ${
              isCollapsed ? "justify-center" : "space-x-4"
            }`}
            title={isCollapsed ? "登出" : ""}
          >
            <ArrowLeftOnRectangleIcon className={iconClass} />
            <span
              className={`whitespace-nowrap overflow-hidden transition-all duration-300 font-medium ${
                isCollapsed ? "w-0 opacity-0" : "w-full opacity-100"
              }`}
            >
              登出
            </span>
          </button>
        )}
      </div>
    </nav>
  );
}