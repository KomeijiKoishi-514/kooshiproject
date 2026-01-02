// client/src/pages/AdminPage.jsx

import React, { useEffect, useState, useMemo } from "react";
import api from "../api/axiosConfig.js";
import toast from 'react-hot-toast';
import { motion, AnimatePresence } from "framer-motion";
import {
  BookOpenIcon,
  PlusIcon,
  PencilSquareIcon,
  TrashIcon,
  MagnifyingGlassIcon,
  XMarkIcon,
  FunnelIcon,
  SwatchIcon,
  TagIcon 
} from "@heroicons/react/24/outline";

export default function AdminPage() {
  // ==========================================
  // 1. 狀態定義
  // ==========================================
  const [courses, setCourses] = useState([]);
  const [search, setSearch] = useState("");
  const [categories, setCategories] = useState([]); // 這裡存的是 categories 資料表的內容
  const [allCourses, setAllCourses] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);

  // 系所管理狀態
  const [departments, setDepartments] = useState([]);
  const [currentDept, setCurrentDept] = useState(510);
  
  // 模組管理狀態
  const [modules, setModules] = useState([]);           
  const [selectedModules, setSelectedModules] = useState([]);

  // 表單資料
  const [formData, setFormData] = useState({
    course_name: "",
    course_code: "",
    credits: 3,
    year_level: 1,
    semester: 1,
    type: "必修",
    dept_id: 510,
  });

  // 分類與先修課狀態
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [prerequisiteIds, setPrerequisiteIds] = useState([]);
  const [filterPrereqsByCategory, setFilterPrereqsByCategory] = useState(true);

  // ==========================================
  // 2. 載入資料
  // ==========================================
  useEffect(() => {
    fetchDepartments();
    fetchCategories(); 
    
    api.get("/plans/modules")
       .then(res => setModules(res.data))
       .catch(err => console.error("載入模組失敗", err));
  }, []);

  useEffect(() => {
    fetchCourses();
  }, [currentDept]);
  
  const fetchDepartments = async () => {
    try {
      const res = await api.get("/departments");
      setDepartments(res.data);
    } catch (err) {
      console.error("無法取得系所列表", err);
    }
  };

  const fetchCourses = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/courses?dept_id=${currentDept}`);
      setCourses(res.data);
      setAllCourses(res.data);
    } catch (err) {
      console.error(err);
      toast.error("無法載入課程資料");
    } finally {
      setLoading(false);
    }
  };

  const fetchCategories = async () => {
    try {
      // 🔥 注意：請確認您的後端路由是 /categories 還是 /courses/categories
      // 這裡假設您將它加在 courseRoutes 裡，所以路徑可能是 /courses/categories
      // 如果您的後端沒有這個路由，請參考上方的「第二步」
      const res = await api.get("/courses/categories").catch(() => api.get("/categories")); 
      setCategories(res.data);
    } catch (err) {
      console.error("無法載入分類標籤 (請確認後端是否已新增 getCategories API)", err);
    }
  };

  // ==========================================
  // 3. 搜尋過濾
  // ==========================================
  const filteredCourses = useMemo(() => {
    return courses.filter((c) =>
      c.course_name.toLowerCase().includes(search.toLowerCase())
    );
  }, [courses, search]);

  const availablePrereqs = useMemo(() => {
    return allCourses.filter(c => {
       if (editing && c.course_id === editing.course_id) return false;
       if (c.year_level > formData.year_level) return false;
       if (filterPrereqsByCategory && selectedCategories.length > 0) {
          const hasCommonCategory = c.categories && c.categories.some(cat => selectedCategories.includes(cat));
          if (!hasCommonCategory && c.categories.length > 0) return false;
       }
       return true;
    });
  }, [allCourses, editing, formData.year_level, selectedCategories, filterPrereqsByCategory]);


  // ==========================================
  // 4. 表單操作
  // ==========================================
  const openModal = (course = null) => {
    setEditing(course);
    if (course) {
      setFormData({
        course_name: course.course_name,
        course_code: course.course_code || "",
        credits: course.credits,
        year_level: course.year_level,
        semester: course.semester,
        type: course.type,
        dept_id: course.dept_id,
      });
      // course.categories 是後端回傳的字串陣列 ['系定必修', '程式設計']
      setSelectedCategories(course.categories || []);
      setPrerequisiteIds([]); 
      setSelectedModules(course.module_ids || []);
    } else {
      setFormData({
        course_name: "",
        course_code: "",
        credits: 3,
        year_level: 1,
        semester: 1,
        type: "必修",
        dept_id: currentDept,
      });
      setSelectedCategories([]);
      setPrerequisiteIds([]);
      setSelectedModules([]);
    }
    setShowModal(true);
  };

  const closeModal = () => {
    setShowModal(false);
    setEditing(null);
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    // 如果改變的是系所 (dept_id)，則清空已選模組
    if (name === "dept_id") {
       setSelectedModules([]); // 簡單暴力：換系就清空模組，避免混亂
    }
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleCategory = (catName) => {
    setSelectedCategories((prev) =>
      prev.includes(catName)
        ? prev.filter((c) => c !== catName)
        : [...prev, catName]
    );
  };

  // ==========================================
  // 5. 送出與刪除
  // ==========================================
  const submitForm = async () => {
    if (!formData.course_name) return toast.error("請輸入課程名稱");

    const payload = {
      ...formData,
      categories: selectedCategories, // 送出選中的分類名稱陣列
      prerequisite_ids: prerequisiteIds,
      module_ids: selectedModules,
    };

    try {
      if (editing) {
        await api.put(`/courses/${editing.course_id}`, payload);
        toast.success("課程更新成功");
      } else {
        await api.post("/courses", payload);
        toast.success("課程新增成功");
      }
      closeModal();
      fetchCourses();
    } catch (err) {
      console.error(err);
      toast.error("操作失敗: " + (err.response?.data?.message || "未知錯誤"));
    }
  };

  const deleteCourse = async (id) => {
    if (!window.confirm("確定要刪除此課程嗎？")) return;
    try {
      await api.delete(`/courses/${id}`);
      toast.success("刪除成功");
      fetchCourses();
    } catch (err) {
      console.error(err);
      toast.error("刪除失敗: " + (err.response?.data?.message || "未知錯誤"));
    }
  };

  // ==========================================
  // 6. 渲染畫面
  // ==========================================
  return (
    <div className="min-h-screen bg-gray-50 font-sans text-gray-800">
      
      {/* 頂部導覽列 */}
      <header className="bg-white shadow-sm sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <BookOpenIcon className="w-6 h-6 text-blue-600" />
            <h1 className="text-xl font-bold text-gray-800">課程資料庫管理</h1>
          </div>
          <div className="flex items-center gap-2">
            <FunnelIcon className="w-5 h-5 text-gray-500" />
            <select 
              value={currentDept}
              onChange={(e) => setCurrentDept(Number(e.target.value))}
              className="border-none bg-gray-100 rounded-full px-4 py-1.5 text-sm font-medium text-gray-700 focus:ring-2 focus:ring-blue-500 cursor-pointer hover:bg-gray-200 transition"
            >
              {departments.map(dept => (
                <option key={dept.dept_id} value={dept.dept_id}>{dept.dept_name}</option>
              ))}
            </select>
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        
        {/* 工具列 */}
        <div className="flex flex-col sm:flex-row justify-between items-center mb-6 gap-4">
          <div className="relative w-full sm:w-96 group">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input
              type="text"
              placeholder="搜尋課程名稱..."
              className="block w-full pl-10 pr-4 py-2.5 border border-gray-200 rounded-xl bg-white focus:ring-2 focus:ring-blue-500 focus:border-transparent outline-none transition-all shadow-sm"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            onClick={() => openModal()}
            className="w-full sm:w-auto flex items-center justify-center gap-2 bg-blue-600 hover:bg-blue-700 text-white px-6 py-2.5 rounded-xl shadow-lg shadow-blue-200 transition-all transform active:scale-95 font-medium"
          >
            <PlusIcon className="w-5 h-5" />
            新增課程
          </button>
        </div>

        {/* 課程列表 */}
        {loading ? (
           <div className="flex justify-center items-center h-64 text-gray-400">載入中...</div>
        ) : filteredCourses.length === 0 ? (
           <div className="flex flex-col items-center justify-center h-64 text-gray-400 border-2 border-dashed border-gray-200 rounded-2xl bg-white">
              <BookOpenIcon className="w-12 h-12 mb-2 opacity-20" />
              <p>找不到相關課程</p>
           </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <AnimatePresence>
              {filteredCourses.map((course) => (
                <motion.div
                  key={course.course_id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  layout
                  className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 hover:shadow-md transition-shadow group relative overflow-hidden"
                >
                  <div className={`absolute left-0 top-0 bottom-0 w-1.5 ${course.type === '必修' ? 'bg-blue-500' : 'bg-green-400'}`}></div>

                  <div className="flex justify-between items-start mb-3 pl-3">
                    <div>
                      <h3 className="text-lg font-bold text-gray-800 leading-tight group-hover:text-blue-600 transition-colors">
                        {course.course_name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs font-mono text-gray-400 bg-gray-50 px-1.5 py-0.5 rounded">{course.year_text}</span>
                          <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${course.type === '必修' ? 'bg-blue-50 text-blue-600' : 'bg-green-50 text-green-600'}`}>
                            {course.type}
                          </span>
                      </div>
                    </div>
                    <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openModal(course)} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors">
                        <PencilSquareIcon className="w-5 h-5" />
                      </button>
                      <button onClick={() => deleteCourse(course.course_id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors">
                        <TrashIcon className="w-5 h-5" />
                      </button>
                    </div>
                  </div>

                  <div className="pl-3 space-y-2">
                    {/* 分類標籤 (List View) */}
                    <div className="flex flex-wrap gap-1.5">
                        {course.categories && course.categories.map((cat, idx) => (
                            <span key={idx} className="text-[10px] px-2 py-1 bg-gray-100 text-gray-600 rounded-md border border-gray-200">
                                #{cat}
                            </span>
                        ))}
                    </div>
                    {/* 模組標籤 (List View) */}
                    {course.module_ids && course.module_ids.length > 0 && modules.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-1">
                            {course.module_ids.map(modId => {
                                const mod = modules.find(m => m.module_id === modId);
                                if (!mod) return null;
                                return (
                                    <span key={modId} className="text-[10px] px-2 py-0.5 bg-purple-50 text-purple-600 rounded-full border border-purple-100 flex items-center gap-1">
                                        <SwatchIcon className="w-3 h-3" />
                                        {mod.module_name}
                                    </span>
                                );
                            })}
                        </div>
                    )}
                  </div>
                  
                  <div className="mt-4 pt-3 border-t border-gray-50 flex justify-between items-center pl-3 text-sm text-gray-500">
                     <span>{course.credits} 學分</span>
                     <span>{course.semester === 1 ? '上學期' : '下學期'}</span>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </main>

      {/* Modal 彈窗 */}
      <AnimatePresence>
        {showModal && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={closeModal}
              className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            />
            
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl z-10 overflow-hidden flex flex-col max-h-[90vh]"
            >
                <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex justify-between items-center">
                    <h2 className="text-xl font-bold text-gray-800 flex items-center gap-2">
                        {editing ? <PencilSquareIcon className="w-6 h-6 text-blue-600" /> : <PlusIcon className="w-6 h-6 text-blue-600" />}
                        {editing ? "編輯課程內容" : "新增課程資料"}
                    </h2>
                    <button onClick={closeModal} className="p-2 hover:bg-gray-200 rounded-full transition-colors text-gray-500">
                        <XMarkIcon className="w-6 h-6" />
                    </button>
                </div>

                <div className="p-6 overflow-y-auto custom-scrollbar space-y-6">
                    {/* 基本資料區 */}
                    <div className="grid grid-cols-2 gap-4">
                        <div className="col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-1">課程名稱</label>
                            <input type="text" name="course_name" value={formData.course_name} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none transition" placeholder="例如：程式設計(一)" />
                        </div>
                        
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">學分數</label>
                            <input type="number" name="credits" value={formData.credits} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none" />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">必/選修</label>
                            <select name="type" value={formData.type} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                <option value="必修">必修</option><option value="選修">選修</option><option value="通識">通識</option>
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">年級</label>
                            <select name="year_level" value={formData.year_level} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                {[1,2,3,4,5,6,7,8].map(y => (
                                    <option key={y} value={y}>{Math.ceil(y/2)}年級 {y%2===1?'上':'下'}</option>
                                ))}
                            </select>
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">所屬系所</label>
                            <select name="dept_id" value={formData.dept_id} onChange={handleInputChange} className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none bg-white">
                                {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                            </select>
                        </div>
                    </div>

                    {/* 🔥 分類標籤區 (修復顯示：放在基本資料下方) */}
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                           <TagIcon className="w-4 h-4 text-blue-600"/> 分類標籤 (Categories)
                        </label>
                        {categories.length > 0 ? (
                            <div className="flex flex-wrap gap-2 p-3 bg-gray-50 rounded-lg border border-gray-200">
                                {categories.map((cat) => (
                                <button
                                    key={cat.category_id}
                                    type="button" // 🔥 重要：防止誤觸發 Submit
                                    onClick={() => toggleCategory(cat.category_name)}
                                    className={`px-3 py-1.5 rounded-full text-sm border transition-all ${
                                    selectedCategories.includes(cat.category_name)
                                        ? "bg-blue-600 text-white border-blue-600 shadow-md transform scale-105"
                                        : "bg-white text-gray-600 border-gray-300 hover:border-blue-400"
                                    }`}
                                >
                                    {cat.category_name}
                                </button>
                                ))}
                            </div>
                        ) : (
                            <div className="text-sm text-gray-400 p-2 bg-gray-50 rounded-lg border border-dashed border-gray-200">
                                無法載入分類，請確認後端是否已實作 getCategories API。
                            </div>
                        )}
                    </div>

                    {/* 模組設定區塊 */}
                    <div className="col-span-2">
                      <label className="block text-sm font-medium text-gray-700 mb-2 flex items-center gap-2">
                        <SwatchIcon className="w-4 h-4 text-purple-600" />
                        所屬分類模組 (可多選)
                      </label>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200">
                        {modules.filter(m => m.dept_id === Number(formData.dept_id)).length > 0 ? (
                          modules
                            // 🔥 關鍵修改：只顯示「目前表單選擇系所」的模組
                            .filter(mod => mod.dept_id === Number(formData.dept_id)) 
                            .map((mod) => (
                              <label 
                                key={mod.module_id} 
                                className={`
                                  cursor-pointer flex items-center p-2 rounded-lg border transition-all
                                  ${selectedModules.includes(mod.module_id) 
                                    ? 'bg-purple-50 border-purple-300 ring-1 ring-purple-300 shadow-sm' 
                                    : 'bg-white border-gray-200 hover:bg-gray-100'}
                                `}
                              >
                                {/* ...原本的 input 與樣式保持不變... */}
                                <input
                                  type="checkbox"
                                  className="hidden"
                                  checked={selectedModules.includes(mod.module_id)}
                                  onChange={(e) => {
                                    if (e.target.checked) {
                                      setSelectedModules([...selectedModules, mod.module_id]);
                                    } else {
                                      setSelectedModules(selectedModules.filter(id => id !== mod.module_id));
                                    }
                                                        }}
                                />
                                <div className={`w-4 h-4 rounded border flex items-center justify-center mr-2 flex-shrink-0 transition-colors ${selectedModules.includes(mod.module_id) ? 'bg-purple-600 border-purple-600' : 'bg-white border-gray-300'}`}>
                                  {selectedModules.includes(mod.module_id) && (
                                     <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                                  )}
                                </div>
                                <span className={`text-sm truncate ${selectedModules.includes(mod.module_id) ? 'text-purple-700 font-bold' : 'text-gray-600'}`}>
                                  {mod.module_name}
                                </span>
                                                    </label>
                            ))
                        ) : (
                          <div className="col-span-full text-center text-sm text-gray-400 py-2">
                            {/* 根據情境顯示不同提示 */}
                            {modules.length === 0 
                              ? "尚未建立任何模組，請先至資料庫新增。" 
                              : "此系所尚未設定任何專屬模組。"}
                          </div>
                        )}
                      </div>
                    </div>

                    {/* 先修課程設定區 */}
                    <div className="pt-4 border-t border-gray-100">
                      <div className="flex justify-between items-center mb-2">
                        <label className="block text-sm font-bold text-gray-700">設定先修課程</label>
                        <label className="flex items-center text-xs text-gray-500 cursor-pointer">
                            <input 
                                type="checkbox" 
                                checked={filterPrereqsByCategory}
                                onChange={(e) => setFilterPrereqsByCategory(e.target.checked)}
                                className="mr-1 rounded text-blue-600 focus:ring-blue-500"
                            />
                            僅顯示同分類課程
                        </label>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                        <select
                          multiple
                          className="w-full h-32 px-3 py-2 border border-orange-200 rounded-lg bg-white focus:ring-2 focus:ring-orange-300 outline-none text-sm"
                          value={prerequisiteIds}
                          onChange={(e) => {
                             const options = Array.from(e.target.selectedOptions, option => option.value);
                             setPrerequisiteIds(options);
                          }}
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
                      </div>
                    </div>

                    {/* Modal 按鈕區 */}
                    <div className="bg-gray-50 px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
                      <button onClick={closeModal} className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-100 transition font-medium">取消</button>
                      <button onClick={submitForm} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition shadow-sm font-medium flex items-center">
                          {editing ? "儲存變更" : "新增課程"}
                      </button>
                    </div>
                </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}