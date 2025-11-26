// client/src/pages/Login.jsx
// 管理員登入頁面
import React, { useState } from "react";
import api from '../api/axiosConfig';
import { useNavigate } from "react-router-dom";

export default function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const nav = useNavigate();

  const submit = async (e) => {
    e.preventDefault();
    try {
      const res = await api.post("/auth/login", { username, password });
      localStorage.setItem("admin_token", res.data.token);
      nav("/admin");
    } catch (err) {
      alert("登入失敗：" + (err.response?.data?.message || err.message));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <form onSubmit={submit} className="bg-white p-6 rounded shadow w-96">
        <h2 className="text-xl mb-4">使用者登入</h2>
        <input className="w-full p-2 border mb-2" placeholder="帳號" value={username} onChange={e=>setUsername(e.target.value)} />
        <input type="password" className="w-full p-2 border mb-4" placeholder="密碼" value={password} onChange={e=>setPassword(e.target.value)} />
        <button className="w-full bg-blue-600 text-white p-2 rounded">登入</button>
      </form>
    </div>
  );
}
