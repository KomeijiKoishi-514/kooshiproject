// client/src/pages/AdminPage.jsx

import React, { useEffect, useState, useMemo, useCallback } from "react";
import api from "../api/axiosConfig.js"; 
import { motion, AnimatePresence } from "framer-motion";

export default function AdminPage() {
  // ==========================================
  // 1. 狀態定義
  // ==========================================
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]);
  const [allCourses, setAllCourses] = useState([]); 
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);

  // 系所管理狀態
  const [departments, setDepartments] = useState([
  ]);
  //  預設510 因為我們是資通系
  const [currentDept, setCurrentDept] = useState(510);
  // 載入系所清單的函式
  const loadDepartments = async () => {
    try {
      const res = await api.get("/departments");
      
      const fetchedDepts = res.data
      //  排除預設的 0
        .filter(d => d.dept_id !== 0) 
        .map(d => ({
          id: d.dept_id,
          name: `${d.dept_name} (${d.dept_id})`
        }));

      // 然後再與我們手動定義的 "通用/校定課程 (0)" 合併
      setDepartments([
        { id: 0, name: "通用/校定課程 (0)" }, // 這裡可以自定義你想要的顯示名稱
        ...fetchedDepts
      ]);

    } catch (err) {
      console.error("無法載入系所列表", err);
    }
  };

  // 排序設定 (預設依照年級升冪排序)
  const [sortConfig, setSortConfig] = useState({ key: 'year_level', direction: 'asc' });

  // 是否開啟「僅顯示同分類先修」過濾功能
  const [filterPrereqsByCategory, setFilterPrereqsByCategory] = useState(true);

  // 表單資料
  const [form, setForm] = useState({
    course_name: "",
    credits: 3,
    semester: "一年級上", 
    type: "必修",
    categories: [],
    year_level: 1, 
    dept_id: 510,
    prerequisite_ids: [],
  });

  const semesterOptions = [
    { label: "一年級 上學期", value: "1-1", text: "一年級上" },
    { label: "一年級 下學期", value: "1-2", text: "一年級下" },
    { label: "二年級 上學期", value: "2-1", text: "二年級上" },
    { label: "二年級 下學期", value: "2-2", text: "二年級下" },
    { label: "三年級 上學期", value: "3-1", text: "三年級上" },
    { label: "三年級 下學期", value: "3-2", text: "三年級下" },
    { label: "四年級 上學期", value: "4-1", text: "四年級上" },
    { label: "四年級 下學期", value: "4-2", text: "四年級下" },
  ];

  // ==========================================
  // 2. API 載入邏輯
  // ==========================================
  
  const loadCourses = useCallback(async () => {
    try {
      const res = await api.get("/courses", {
        params: { dept_id: currentDept }
      });
      setCourses(res.data);
      setAllCourses(res.data); 
    } catch (err) {
      console.error(err);
    }
  }, [currentDept]);

  const loadCategories = async () => {
    try {
      const res = await api.get("/course-categories");
      setCategories(res.data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    loadCourses();
  }, [loadCourses]);

  useEffect(() => {
    loadDepartments();
    loadCategories();
  }, []);

  // ==========================================
  // 3. 資料處理邏輯 (排序 & 篩選)
  // ==========================================

  // 處理表頭排序點擊
  const handleSort = (key) => {
    let direction = 'asc';
    if (sortConfig.key === key && sortConfig.direction === 'asc') {
      direction = 'desc';
    }
    setSortConfig({ key, direction });
  };

  // 顯示排序圖示
  const getSortIcon = (columnKey) => {
    if (sortConfig.key !== columnKey) return <span className="text-gray-300 opacity-0 group-hover:opacity-50 ml-1">⇅</span>;
    return sortConfig.direction === 'asc' ? <span className="ml-1">▲</span> : <span className="ml-1">▼</span>;
  };

  // 計算最終顯示的課程列表 (搜尋 + 排序)
  const processedCourses = useMemo(() => {
    // A. 搜尋過濾
    let result = courses.filter((c) =>
      c.course_name.toLowerCase().includes(search.toLowerCase())
    );

    // B. 排序
    if (sortConfig.key) {
      result.sort((a, b) => {
        let aValue, bValue;

        if (sortConfig.key === 'categories') {
            // 分類取第一個字串比較
            aValue = a.categories?.[0] || "";
            bValue = b.categories?.[0] || "";
        } else {
            aValue = a[sortConfig.key];
            bValue = b[sortConfig.key];
        }

        if (aValue < bValue) return sortConfig.direction === 'asc' ? -1 : 1;
        if (aValue > bValue) return sortConfig.direction === 'asc' ? 1 : -1;
        return 0;
      });
    }
    return result;
  }, [courses, search, sortConfig]);

  // 計算新增/編輯 Modal 中的先修課程選項
  const availablePrereqs = useMemo(() => {
    let filtered = allCourses.filter(c => c.course_id !== editing);

    if (filterPrereqsByCategory && form.categories.length > 0) {
      filtered = filtered.filter(course => {
        const hasSharedCategory = course.categories?.some(cat => 
          form.categories.includes(cat)
        );
        return hasSharedCategory;
      });
    }
    filtered.sort((a, b) => a.year_level - b.year_level);
    return filtered;
  }, [allCourses, form.categories, editing, filterPrereqsByCategory]);


  // ==========================================
  // 4. 表單處理
  // ==========================================

  const handleTimeChange = (e) => {
    const val = e.target.value;
    if (!val) return;
    const [yearStr, semStr] = val.split("-");
    const year = parseInt(yearStr, 10);
    const sem = parseInt(semStr, 10);
    const calculatedYearLevel = (year - 1) * 2 + sem;
    const selectedOption = semesterOptions.find(opt => opt.value === val);
    const semesterText = selectedOption ? selectedOption.text : "";

    setForm({
      ...form,
      year_level: calculatedYearLevel,
      semester: semesterText,
    });
  };

  const getSelectValueFromAbsoluteLevel = (level) => {
    if (!level) return "";
    const year = Math.ceil(level / 2);
    const sem = level % 2 === 0 ? 2 : 1;
    return `${year}-${sem}`;
  };

  const openModal = (course = null) => {
    setFilterPrereqsByCategory(true);
    if (course) {
      setEditing(course.course_id);
      setForm({
        course_name: course.course_name,
        credits: course.credits,
        semester: course.semester,
        type: course.type,
        categories: course.categories || [],
        year_level: Number(course.year_level),
        dept_id: course.dept_id,
        prerequisite_ids: course.prerequisite_ids || [], 
      });
    } else {
      setEditing(null);
      setForm({
        course_name: "",
        credits: 3,
        semester: "一年級上", 
        type: "必修",
        categories: [],
        year_level: 1, 
        dept_id: currentDept,
        prerequisite_ids: [],
      });
    }
    setShowModal(true);
  };

  const closeModal = () => setShowModal(false);

  const submitForm = async () => {
    try {
      if (!form.course_name) return alert("請輸入課程名稱");
      
      if (editing) {
        await api.put(`/courses/${editing}`, form);
        alert("更新完成");
      } else {
        await api.post("/courses", form);
        alert("新增完成");
      }
      closeModal();
      loadCourses();
    } catch (err) {
      const errorMsg = err.response?.data?.detail || err.response?.data?.message || err.message;
      alert("操作失敗：" + errorMsg);
    }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm("確定刪除？")) return;
    try {
      await api.delete(`/courses/${id}`);
      loadCourses();
    } catch (err) {
      alert("刪除失敗：" + err.response?.data?.message);
    }
  };

  // ==========================================
  // 5. Render 畫面
  // ==========================================
  return (
    <div className="min-h-screen p-8" style={{ background: "linear-gradient(to bottom right, #ffffff, #cbe3ff)" }}>
      
      {/* 標題與系所選擇 */}
      <div className="flex justify-between items-end mb-6">
        <h1 className="text-3xl font-bold">課程管理系統</h1>
        
        <div className="flex flex-col items-end">
          <label className="text-sm font-bold text-gray-600 mb-1">目前管理系所</label>
          <select 
            className="p-2 border-2 border-blue-500 rounded font-bold text-blue-900 shadow bg-white"
            value={currentDept}
            onChange={(e) => setCurrentDept(Number(e.target.value))}
          >
            {departments.map(d => (
              <option key={d.id} value={d.id}>{d.name}</option>
            ))}
          </select>
        </div>
      </div>

      {/* 搜尋與新增按鈕 */}
      <div className="flex justify-between items-center mb-4">
        <input
          placeholder="搜尋課程..."
          className="p-2 border rounded w-64 shadow"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <button onClick={() => openModal()} className="px-4 py-2 bg-blue-600 text-white rounded shadow hover:bg-blue-700 transition">
           新增 {currentDept === 0 ? "通用" : "系上"} 課程
        </button>
      </div>

      {/* 課程列表 Table */}
      <table className="w-full bg-white rounded shadow table-auto">
        <thead>
          <tr className="bg-blue-100 border-b text-gray-700">
            {/* 可排序表頭：課程名稱 */}
            <th 
              className="p-3 text-left cursor-pointer hover:bg-blue-200 transition-colors group select-none"
              onClick={() => handleSort('course_name')}
            >
              課程名稱 {getSortIcon('course_name')}
            </th>

            {/* 可排序表頭：學分 */}
            <th 
              className="p-3 text-left cursor-pointer hover:bg-blue-200 transition-colors group select-none"
              onClick={() => handleSort('credits')}
            >
              學分 {getSortIcon('credits')}
            </th>

            {/* 可排序表頭：時段 (依照 year_level 數值排序) */}
            <th 
              className="p-3 text-left cursor-pointer hover:bg-blue-200 transition-colors group select-none"
              onClick={() => handleSort('year_level')}
            >
              時段 {getSortIcon('year_level')}
            </th>

            {/* 可排序表頭：分類 */}
            <th 
              className="p-3 text-left cursor-pointer hover:bg-blue-200 transition-colors group select-none"
              onClick={() => handleSort('categories')}
            >
              分類 {getSortIcon('categories')}
            </th>

            <th className="p-3 text-left">操作</th>
          </tr>
        </thead>
        <tbody>
          {processedCourses.length === 0 ? (
             <tr><td colSpan="5" className="p-8 text-center text-gray-500">無符合課程</td></tr>
          ) : (
            processedCourses.map((c) => (
              <tr key={c.course_id} className="border-b hover:bg-blue-50">
                <td className="p-3 font-medium">{c.course_name}</td>
                <td className="p-3">{c.credits}</td>
                <td className="p-3">
                  <span className="font-medium text-gray-800">{c.year_text}</span>
                  <span className="text-gray-400 text-xs ml-1">(Lv.{c.year_level})</span>
                </td>
                <td className="p-3">
                  <div className="flex flex-wrap gap-1">
                    {c.categories?.map((cat, i) => (
                        <span key={i} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-full font-medium">
                            {cat}
                        </span>
                    ))}
                  </div>
                </td>
                <td className="p-3 space-x-2">
                  <button onClick={() => openModal(c)} className="bg-yellow-400 px-3 py-1 rounded text-sm hover:bg-yellow-500 shadow-sm transition">編輯</button>
                  <button onClick={() => deleteCourse(c.course_id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600 shadow-sm transition">刪除</button>
                </td>
              </tr>
            ))
          )}
        </tbody>
      </table>

      {/* 新增/編輯 Modal */}
      <AnimatePresence>
        {showModal && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/40 flex justify-center items-center z-50"
          >
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.8, opacity: 0 }}
              className="bg-white p-6 rounded-lg shadow-xl w-[500px]"
            >
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">{editing ? "編輯課程" : "新增課程"}</h2>
                <span className="text-xs font-bold px-2 py-1 bg-gray-100 rounded text-gray-600">
                  所屬：{departments.find(d => d.id === form.dept_id)?.name}
                </span>
              </div>
              
              <div className="space-y-3">
                {/* 課程名稱 */}
                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-bold">課程名稱</label>
                  <input className="w-full border p-2 rounded" placeholder="例如：網頁設計" value={form.course_name} onChange={(e) => setForm({ ...form, course_name: e.target.value })} />
                </div>

                {/* 學分 */}
                <div>
                   <label className="block text-gray-700 mb-1 text-sm font-bold">學分</label>
                   <input type="number" className="w-full border p-2 rounded" value={form.credits} onChange={(e) => setForm({ ...form, credits: Number(e.target.value) })} />
                </div>

                {/* 開課時段 */}
                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-bold">開課時段</label>
                  <select
                    className="w-full border p-2 rounded bg-white"
                    value={getSelectValueFromAbsoluteLevel(form.year_level)}
                    onChange={handleTimeChange}
                  >
                    {semesterOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* 分類選擇 */}
                <div>
                  <label className="block text-gray-700 mb-1 text-sm font-bold">分類 (Ctrl多選)：</label>
                  <select multiple className="w-full border p-2 rounded h-24" value={form.categories} onChange={(e) => setForm({ ...form, categories: [...e.target.selectedOptions].map((o) => o.value) })}>
                    {categories.map((cat) => (
                      <option key={cat.category_id} value={cat.category_name}>{cat.category_name}</option>
                    ))}
                  </select>
                </div>

                {/* 先修課程選擇 (優化版) */}
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <label className="block text-gray-700 text-sm font-bold">
                      先修課程 (Ctrl多選)：
                    </label>
                    <label className="flex items-center space-x-1 text-xs text-blue-600 cursor-pointer select-none">
                      <input 
                        type="checkbox" 
                        checked={filterPrereqsByCategory} 
                        onChange={(e) => setFilterPrereqsByCategory(e.target.checked)} 
                      />
                      <span>僅顯示相關分類</span>
                    </label>
                  </div>
                  
                  <select 
                    multiple 
                    className="w-full border p-2 rounded h-24" 
                    value={form.prerequisite_ids} 
                    onChange={(e) => setForm({ ...form, prerequisite_ids: [...e.target.selectedOptions].map((o) => Number(o.value)) })}
                  >
                    {availablePrereqs.length === 0 ? (
                      <option disabled>無符合條件的課程</option>
                    ) : (
                      availablePrereqs.map((c) => (
                        <option key={c.course_id} value={c.course_id}>
                          {c.course_name} ({c.year_text || `Lv.${c.year_level}`})
                        </option>
                      ))
                    )}
                  </select>
                  <p className="text-xs text-gray-400 mt-1">
                    * 如找不到課程，請取消勾選「僅顯示相關分類」
                  </p>
                </div>
              </div>

              <div className="flex justify-end mt-4 space-x-3">
                <button onClick={closeModal} className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 transition">取消</button>
                <button onClick={submitForm} className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition">保存</button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}