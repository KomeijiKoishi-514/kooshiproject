// client/src/pages/AdminUsersPage.jsx

import React, { useState, useEffect } from "react";
import api from "../api/axiosConfig";
// 🔥 1. 引入 Framer Motion
import { motion, AnimatePresence } from "framer-motion";
import {
  UserGroupIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  XMarkIcon,
} from "@heroicons/react/24/outline";

export default function AdminUsersPage() {
  // ===========================
  // 1. 狀態定義 (保持不變)
  // ===========================
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [actionMessage, setActionMessage] = useState({ type: '', content: '' });

  // --- Modal 相關狀態 ---
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [editingUser, setEditingUser] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  // --- 表單資料狀態 ---
  const initialFormData = {
      username: '', full_name: '', email: '', password: '', role: 'student', dept_id: ''
  };
  const [formData, setFormData] = useState(initialFormData);

  const currentUserId = JSON.parse(localStorage.getItem("user_info") || "{}").id;

  // ===========================
  // 2. 副作用與輔助函式 (保持不變)
  // ===========================
  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const res = await api.get("/admin/users");
      setUsers(res.data);
      setError("");
    } catch (err) {
        console.error("載入失敗:", err);
        setError(err.response?.data?.message || "無法載入使用者列表。");
    } finally {
      setLoading(false);
    }
  };

  const getRoleName = (role) => {
      switch(role) {
          case 'admin': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-purple-100 text-purple-800">管理員</span>;
          case 'student': return <span className="px-2 py-1 text-xs font-semibold rounded-full bg-blue-100 text-blue-800">學生</span>;
          default: return role;
      }
  }

  const showActionMessage = (type, content) => {
      setActionMessage({ type, content });
      setTimeout(() => setActionMessage({ type: '', content: '' }), 3000);
  }

  // ===========================
  // 3. 事件處理 (CRUD Logic) (保持不變)
  // ===========================

  // --- Modal 操作 ---
  const handleOpenModal = (mode, user = null) => {
      setModalMode(mode);
      setEditingUser(user);
      setError("");
      if (mode === 'edit' && user) {
          setFormData({
              username: user.username,
              full_name: user.full_name,
              email: user.email,
              password: '',
              role: user.role,
              dept_id: user.dept_id || ''
          });
      } else {
          setFormData(initialFormData);
      }
      setIsModalOpen(true);
  };

  const handleCloseModal = () => {
      setIsModalOpen(false);
      setEditingUser(null);
      setFormData(initialFormData);
  };

// --- 表單變更處理 ---
  const handleChange = (e) => {
      const { name, value } = e.target;
      setFormData(prevData => {
          const newData = { ...prevData, [name]: value };
          if (name === 'role' && value === 'admin') {
              newData.dept_id = '';
          }
          return newData;
      });
  }

  // --- 表單送出 (Create / Update) ---
  const handleSubmit = async (e) => {
      e.preventDefault();
      setSubmitting(true);
      if (modalMode === 'create' && !formData.password) {
          alert("新增使用者時，密碼為必填欄位。");
          setSubmitting(false);
          return;
      }

      try {
          const payload = { ...formData };
          if (payload.dept_id === '') payload.dept_id = null;

          if (modalMode === 'create') {
              await api.post("/admin/users", payload);
              showActionMessage('success', `使用者 ${payload.username} 新增成功！`);
          } else {
              await api.put(`/admin/users/${editingUser.user_id}`, payload);
              showActionMessage('success', `使用者 ${payload.username} 資料更新成功！`);
          }
          handleCloseModal();
          fetchUsers();

      } catch (err) {
          console.error("儲存失敗:", err);
          alert(`儲存失敗：${err.response?.data?.message || err.message}`);
      } finally {
          setSubmitting(false);
      }
  };

  // --- 刪除使用者 (Delete) ---
  const handleDelete = async (userId, username) => {
      if (userId === currentUserId) {
          alert("您無法刪除自己目前登入的帳號。");
          return;
      }

      if (!window.confirm(`確定要刪除使用者「${username}」嗎？此操作無法復原。`)) {
          return;
      }

      try {
          await api.delete(`/admin/users/${userId}`);
          showActionMessage('success', `使用者 ${username} 已成功刪除。`);
          fetchUsers();
      } catch (err) {
          console.error("刪除失敗:", err);
          alert(`刪除失敗：${err.response?.data?.message || err.message}`);
      }
  }


  // ===========================
  // 4. Render 介面
  // ===========================
  return (
    <div className="p-6 max-w-7xl mx-auto relative">
      {/* 頁面標題與新增按鈕 (保持不變) */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800 flex items-center">
          <UserGroupIcon className="h-10 w-10 mr-3 text-blue-600" />
          帳號管理
        </h1>
        <button
          onClick={() => handleOpenModal('create')}
          className="flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm"
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          新增使用者
        </button>
      </div>

      {/* 訊息提示 (保持不變) */}
      {actionMessage.content && (
        <div className={`p-4 mb-6 rounded-lg border-l-4 ${actionMessage.type === 'success' ? 'bg-green-50 border-green-400 text-green-700' : 'bg-red-50 border-red-400 text-red-700'}`}>
          {actionMessage.content}
        </div>
      )}
       {error && (
        <div className="bg-red-50 border-l-4 border-red-400 p-4 mb-6 text-red-700">
          {error}
        </div>
      )}

      {/* 資料表格 (保持不變) */}
      <div className="bg-white rounded-xl shadow-md overflow-hidden border border-gray-200">
        {loading ? (
          <div className="p-8 text-center text-gray-500 flex justify-center items-center"><svg className="animate-spin h-5 w-5 mr-3" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>資料載入中...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">帳號</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">姓名</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">角色</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">系所</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">信箱</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider w-32">操作</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {users.map((user) => (
                  <tr key={user.user_id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.user_id}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{user.username}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">{user.full_name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{getRoleName(user.role)}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.dept_id || '-'}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">{user.email}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium space-x-3">
                      <button
                        onClick={() => handleOpenModal('edit', user)}
                        className="text-indigo-600 hover:text-indigo-900 transition p-1 rounded hover:bg-indigo-100"
                        title="編輯"
                      >
                        <PencilSquareIcon className="h-5 w-5" />
                      </button>
                      <button
                        onClick={() => handleDelete(user.user_id, user.username)}
                        className={`transition p-1 rounded ${user.user_id === currentUserId ? 'text-gray-400 cursor-not-allowed' : 'text-red-600 hover:text-red-900 hover:bg-red-100'}`}
                        title={user.user_id === currentUserId ? "不能刪除自己" : "刪除"}
                        disabled={user.user_id === currentUserId}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            {users.length === 0 && !loading && (
                <div className="p-8 text-center text-gray-500">目前沒有任何使用者資料。</div>
            )}
          </div>
        )}
      </div>

      {/* =========================== */}
      {/* 🔥🔥🔥 新增/編輯 Modal (加上 Framer Motion 動畫) 🔥🔥🔥 */}
      {/* =========================== */}
      {/* 2. 使用 AnimatePresence 包裹條件渲染 */}
      <AnimatePresence>
        {isModalOpen && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
            <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
                {/* 3. 背景遮罩改為 motion.div 並加入淡入淡出動畫 */}
                <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="fixed inset-0 transition-opacity"
                    aria-hidden="true"
                >
                    <div className="absolute inset-0 bg-gray-500 opacity-75" onClick={handleCloseModal}></div>
                </motion.div>

                <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

                {/* 4. Modal 本體改為 motion.div 並加入縮放與淡入淡出動畫 */}
                {/* 🔥 重要：加入 relative z-10 防止被背景覆蓋 */}
                <motion.div
                    initial={{ scale: 0.95, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    exit={{ scale: 0.95, opacity: 0 }}
                    transition={{ duration: 0.3 }}
                    className="inline-block align-bottom bg-white rounded-2xl text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg w-full relative z-10"
                >
                    {/* ... (Modal 內部表單內容保持完全不變) ... */}
                    <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                        <h3 className="text-xl font-semibold text-gray-800">
                            {modalMode === 'create' ? '新增使用者' : `編輯使用者：${editingUser?.username}`}
                        </h3>
                        <button onClick={handleCloseModal} className="text-gray-400 hover:text-gray-600 transition">
                            <XMarkIcon className="h-6 w-6" />
                        </button>
                    </div>

                    <form onSubmit={handleSubmit} className="p-6 space-y-4">
                        {/* 帳號與姓名 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">帳號 (Username) *</label>
                                <input type="text" name="username" required value={formData.username} onChange={handleChange} className="w-full p-2 border rounded focus:ring-blue-500" />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">真實姓名 *</label>
                                <input type="text" name="full_name" required value={formData.full_name} onChange={handleChange} className="w-full p-2 border rounded focus:ring-blue-500" />
                            </div>
                        </div>

                        {/* 信箱 */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">電子郵件 *</label>
                            <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full p-2 border rounded focus:ring-blue-500" />
                        </div>

                         {/* 密碼 (編輯模式為選填) */}
                         <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">
                                密碼 {modalMode === 'create' ? '*' : '(若不修改請留空)'}
                            </label>
                            <input
                                type="password"
                                name="password"
                                // 新增模式必填，編輯模式選填
                                required={modalMode === 'create'}
                                value={formData.password}
                                onChange={handleChange}
                                placeholder={modalMode === 'edit' ? "不修改請留空" : ""}
                                className="w-full p-2 border rounded focus:ring-blue-500"
                            />
                        </div>

                        {/* 角色與系所 */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">角色 *</label>
                                <select name="role" value={formData.role} onChange={handleChange} className="w-full p-2 border rounded focus:ring-blue-500 bg-white">
                                    <option value="student">學生 (student)</option>
                                    <option value="admin">管理員 (admin)</option>
                                </select>
                            </div>
                            <div>
                                <label className={`block text-sm font-medium mb-1 ${formData.role === 'admin' ? 'text-gray-400' : 'text-gray-700'}`}>
                                    系所代碼
                                    {formData.role === 'admin' && <span className="text-xs ml-2">(管理員毋需填寫)</span>}
                                </label>
                                <input
                                    type="number"
                                    name="dept_id"
                                    value={formData.dept_id}
                                    onChange={handleChange}
                                    // 1. 根據角色決定 placeholder 提示文字
                                    placeholder={formData.role === 'admin' ? "不適用" : "例如: 510"}
                                    // 2. 核心：如果角色是 admin，就禁用此欄位
                                    disabled={formData.role === 'admin'}
                                    // 3. 根據禁用狀態改變樣式 (變灰、滑鼠游標變成禁止符號)
                                    className={`w-full p-2 border rounded focus:ring-blue-500 transition-colors
                                        ${formData.role === 'admin'
                                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed border-gray-200'
                                            : 'bg-white border-gray-300'
                                        }`
                                    }
                                />
                            </div>
                        </div>

                        {/* 按鈕區 */}
                        <div className="flex justify-end space-x-3 pt-4 border-t border-gray-100 mt-6">
                            <button type="button" onClick={handleCloseModal} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition">取消</button>
                            <button
                                type="submit"
                                disabled={submitting}
                                className={`px-4 py-2 rounded-lg text-white font-medium transition flex items-center ${submitting ? 'bg-blue-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700'}`}
                            >
                                 {submitting && <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path></svg>}
                                {modalMode === 'create' ? '建立使用者' : '儲存變更'}
                            </button>
                        </div>
                    </form>
                </motion.div>
            </div>
        </div>  
        )}
      </AnimatePresence>

    </div>
  );
}