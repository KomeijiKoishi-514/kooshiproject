// client/src/pages/CoursePlanningPage.jsx

import React, { useState, useEffect, useMemo, useCallback } from "react";
import api from "../api/axiosConfig";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import { DndContext, useDraggable, useDroppable, DragOverlay } from "@dnd-kit/core";
import { CSS } from "@dnd-kit/utilities";
import {
  MagnifyingGlassIcon,
  FunnelIcon,
  TrashIcon,
  AcademicCapIcon,
  CalendarDaysIcon,
  ExclamationTriangleIcon,
  MapIcon,        // 🔥 新增：用於模組 UI
  SparklesIcon,   // 🔥 新增：用於模組 UI
  SwatchIcon,     // 🔥 新增：用於模組 UI
  CheckBadgeIcon, // 🔥 新增：用於模組 UI
  XMarkIcon       // 🔥 新增：用於模組 UI
} from "@heroicons/react/24/outline";

// ==========================================
// 🧩 元件：可拖曳的課程卡片 (維持不變)
// ==========================================
const DraggableCourse = React.memo(({ course, isPlanned }) => {
  const { attributes, listeners, setNodeRef, transform, isDragging } = useDraggable({
    id: `course-${course.course_id}`,
    data: { course },
    disabled: isPlanned || course.type === '必修',
  });

  const style = {
    transform: CSS.Translate.toString(transform),
    zIndex: isDragging ? 999 : 'auto',
    opacity: isDragging ? 0.5 : 1,
  };

  const isCompulsory = course.type === '必修';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...listeners}
      {...attributes}
      className={`p-4 rounded-xl shadow-sm border transition-all cursor-grab active:cursor-grabbing touch-none
        ${isCompulsory 
            ? 'bg-gray-50 border-gray-200 opacity-60 cursor-not-allowed'
            : isPlanned 
                ? 'bg-green-50 border-green-200 cursor-default'
                : 'bg-white border-gray-200 hover:border-blue-400 hover:shadow-md'
        }`}
    >
      <div className="flex justify-between items-start">
        <div>
          <h3 className="font-bold text-gray-800">{course.course_name}</h3>
          <div className="flex items-center space-x-2 text-sm text-gray-500 mt-1">
            <span className={`px-2 py-0.5 rounded-full text-xs ${course.type === '必修' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{course.type}</span>
            <span>{course.credits} 學分</span>
          </div>
        </div>
        {isCompulsory ? (
             <span className="text-xs font-medium text-gray-400 bg-gray-100 px-2 py-1 rounded-full">必修</span>
        ) : isPlanned && (
             <span className="text-xs font-medium text-green-600 bg-green-100 px-2 py-1 rounded-full">已規劃</span>
        )}
      </div>
    </div>
  );
});

// ==========================================
// 🧩 新增元件：模組卡片 (Sidebar Item)
// ==========================================
const ModuleItem = ({ module, onClick }) => (
  <div 
    onClick={() => onClick(module)}
    className="p-4 rounded-xl border border-gray-200 bg-white hover:border-purple-400 hover:shadow-md cursor-pointer transition-all group relative overflow-hidden"
  >
    <div className="flex items-center justify-between mb-2 relative z-10">
      <div className={`p-2 rounded-lg bg-purple-100 text-purple-600`}>
        <SwatchIcon className="h-6 w-6" />
      </div>
      <span className="text-xs font-medium text-gray-400 group-hover:text-purple-500 transition-colors flex items-center gap-1">
        點擊預覽 <MapIcon className="w-3 h-3" />
      </span>
    </div>
    <h3 className="font-bold text-gray-800 text-lg relative z-10">{module.module_name}</h3>
    <p className="text-sm text-gray-500 mt-1 line-clamp-2 relative z-10">{module.description}</p>
    
    {/* 裝飾背景 */}
    <div className="absolute right-0 bottom-0 opacity-5 transform translate-x-1/3 translate-y-1/3">
        <SparklesIcon className="w-24 h-24 text-purple-600" />
    </div>
  </div>
);

// ==========================================
// 🧩 新增元件：模組預覽視窗 (Modal)
// ==========================================
const ModulePreviewModal = ({ isOpen, module, onClose, onConfirm, isImporting }) => {
  if (!isOpen || !module) return null;

  return (
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* 背景遮罩 */}
      <motion.div 
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="absolute inset-0 bg-black/60 backdrop-blur-sm" 
        onClick={onClose} 
      />
      
      {/* 視窗本體 */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.95, y: 20 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.95, y: 20 }}
        className="bg-white rounded-2xl shadow-2xl w-full max-w-lg z-10 overflow-hidden flex flex-col max-h-[85vh]"
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 p-6 text-white relative overflow-hidden">
          <div className="relative z-10">
            <h2 className="text-2xl font-bold flex items-center gap-2">
                <SparklesIcon className="h-7 w-7 text-yellow-300 animate-pulse" />
                {module.module_name}
            </h2>
            <p className="text-purple-100 mt-2 opacity-90 text-sm leading-relaxed">{module.description}</p>
          </div>
          {/* 裝飾背景 */}
          <SparklesIcon className="absolute -bottom-4 -right-4 w-32 h-32 text-white/10 rotate-12" />
        </div>

        {/* Course List */}
        <div className="p-6 overflow-y-auto flex-1 bg-gray-50">
          <h4 className="font-bold text-gray-700 mb-4 flex items-center text-sm uppercase tracking-wider">
            <CheckBadgeIcon className="h-5 w-5 mr-2 text-green-500" />
            包含課程清單
          </h4>
          <div className="space-y-3">
            {module.courses && module.courses.length > 0 ? (
                module.courses.map(c => (
                  <div key={c.course_id} className="flex justify-between items-center p-3 bg-white rounded-xl border border-gray-200 shadow-sm hover:border-purple-200 transition-colors">
                    <span className="font-bold text-gray-700">{c.course_name}</span>
                    <span className="text-xs px-2.5 py-1 bg-gray-100 rounded-md text-gray-500 font-medium border border-gray-200">
                      {c.credits} 學分 · {c.year_level}年級{c.semester === 1 ? '上' : '下'}
                    </span>
                  </div>
                ))
            ) : (
                <div className="text-center text-gray-400 py-8 italic border-2 border-dashed border-gray-200 rounded-xl">
                    此模組尚未設定課程
                </div>
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 border-t bg-white flex gap-3 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
          <button onClick={onClose} className="flex-1 py-3 rounded-xl border border-gray-300 text-gray-600 font-bold hover:bg-gray-50 transition-colors focus:outline-none focus:ring-2 focus:ring-gray-200">
            取消
          </button>
          <button 
            onClick={() => onConfirm(module.module_id)} 
            disabled={isImporting}
            className={`flex-[2] py-3 rounded-xl text-white font-bold shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 focus:outline-none focus:ring-2 focus:ring-purple-400 focus:ring-offset-2
              ${isImporting ? 'bg-gray-400 cursor-wait' : 'bg-purple-600 hover:bg-purple-700 hover:shadow-purple-200'}
            `}
          >
            {isImporting ? (
                <>
                    <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    正在為您規劃...
                </>
            ) : (
                <>
                    <SparklesIcon className="w-5 h-5" />
                    一鍵匯入規劃
                </>
            )}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

// ==========================================
// 🧩 DroppableSemester (維持不變)
// ==========================================
const DroppableSemester = React.memo(({ id, label, credits, children }) => {
  const { setNodeRef, isOver } = useDroppable({ id: id });
  return (
    <div ref={setNodeRef} className={`rounded-2xl shadow-sm border overflow-hidden flex flex-col h-full transition-colors duration-300 ${isOver ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-300' : 'border-gray-200 bg-white'}`}>
      <div className={`px-4 py-3 border-b flex justify-between items-center ${isOver ? 'bg-blue-100' : 'bg-gray-100'}`}>
        <h3 className="font-bold text-gray-700 flex items-center"><CalendarDaysIcon className="h-5 w-5 mr-2 text-gray-500" />{label}</h3>
        <span className={`text-sm font-medium ${credits > 0 ? 'text-blue-600' : 'text-gray-400'}`}>{credits} 學分</span>
      </div>
      <div className="p-3 flex-1 space-y-2 min-h-[150px]">{children}{isOver && <div className="h-12 border-2 border-dashed border-blue-300 rounded-lg flex items-center justify-center text-blue-400 text-sm bg-white/50">放開以加入此學期</div>}</div>
    </div>
  );
});

// ==========================================
// 🧩 PlanItem (維持不變)
// ==========================================
const PlanItem = React.memo(({ item, onRemove }) => {
  return (
    <div className={`p-3 rounded-lg border shadow-sm flex justify-between items-center ${item.isManual ? 'bg-white border-gray-200' : 'bg-red-50 border-red-100'}`}>
      <div>
        <div className="font-medium text-gray-800">{item.course_name}</div>
        <div className="text-xs text-gray-500 mt-0.5"><span className={`mr-2 ${item.type === '必修' ? 'text-red-600' : 'text-blue-600'}`}>{item.type}{!item.isManual && ' (必修)'}</span>{item.credits} 學分</div>
      </div>
      {item.isManual && <button onClick={() => onRemove(item.plan_id, item.course_name)} className="text-gray-300 hover:text-red-500 p-1 transition-colors"><TrashIcon className="h-5 w-5" /></button>}
    </div>
  );
});

// ==========================================
// 🧩 SidebarList (維持不變)
// ==========================================
const SidebarList = React.memo(({ courses, isPlannedFunc }) => {
  return (
    <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-gray-50 scrollbar-thin">
      {courses.map(course => <DraggableCourse key={course.course_id} course={course} isPlanned={isPlannedFunc(course.course_id)} />)}
    </div>
  );
});

// ==========================================
// 🚀 主頁面元件 (CoursePlanningPage)
// ==========================================
export default function CoursePlanningPage() {
  const [loading, setLoading] = useState(true);
  const [allCourses, setAllCourses] = useState([]);
  const [myPlan, setMyPlan] = useState([]);
  const [departments, setDepartments] = useState([]);
  
  // 🔥 新增：模組相關 State
  const [modules, setModules] = useState([]); 
  const [activeSidebarTab, setActiveSidebarTab] = useState("courses"); // 'courses' | 'modules'
  const [selectedModule, setSelectedModule] = useState(null);
  const [isImportingModule, setIsImportingModule] = useState(false);

  const [activeDragItem, setActiveDragItem] = useState(null);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("all");
  const [filterYearLevel, setFilterYearLevel] = useState("all");
  
  const [deleteConfirmation, setDeleteConfirmation] = useState({ isOpen: false, planId: null, courseName: "" });

  const planStructure = useMemo(() => [
    { label: "大一 上", yearOffset: 0, sem: 1 }, { label: "大一 下", yearOffset: 0, sem: 2 },
    { label: "大二 上", yearOffset: 1, sem: 1 }, { label: "大二 下", yearOffset: 1, sem: 2 },
    { label: "大三 上", yearOffset: 2, sem: 1 }, { label: "大三 下", yearOffset: 2, sem: 2 },
    { label: "大四 上", yearOffset: 3, sem: 1 }, { label: "大四 下", yearOffset: 3, sem: 2 },
  ], []);
  
  const startAcademicYear = 113;

  const userDeptId = useMemo(() => {
    try { return JSON.parse(localStorage.getItem("user_info"))?.dept_id || null; } catch (e) { return null; }
  }, []);

  useEffect(() => { fetchInitialData(); }, []);

  const fetchInitialData = async () => {
    setLoading(true);
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1500));

    try {
      // 🔥 修改：多抓一個 /plans/modules API
      const dataRequests = Promise.all([
        api.get("/courses"),      
        api.get("/plans"),        
        api.get("/departments"),
        api.get("/plans/modules") // 假設路徑是這個，請確認與後端一致
      ]);

      const [[coursesRes, planRes, deptsRes, modulesRes]] = await Promise.all([dataRequests, minLoadingTime]);

      setAllCourses(coursesRes.data);
      setMyPlan(planRes.data);
      setDepartments(deptsRes.data.filter(d => d.dept_id !== 0));
      setModules(modulesRes.data || []); // 存入模組
    } catch (err) {
      console.error(err);
      toast.error("載入失敗");
    } finally {
      setLoading(false);
    }
  };

  const filteredCourses = useMemo(() => {
    return allCourses.filter(course => {
      const matchSearch = course.course_name.toLowerCase().includes(search.toLowerCase());
      let matchDept = filterDept === 'all' ? true : (course.dept_id === Number(filterDept) || course.dept_id === 0);
      const matchYear = filterYearLevel === 'all' || course.year_level === Number(filterYearLevel);
      return matchSearch && matchDept && matchYear;
    });
  }, [allCourses, search, filterDept, filterYearLevel]);

  const structuredPlan = useMemo(() => {
    const map = {};
    myPlan.forEach(planItem => {
      const key = `${planItem.academic_year}-${planItem.semester}`;
      if (!map[key]) map[key] = [];
      map[key].push({ ...planItem, isManual: true });
    });
    if (userDeptId) {
      const compulsoryCourses = allCourses.filter(c => c.type === '必修' && (c.dept_id === userDeptId || c.dept_id === 0));
      compulsoryCourses.forEach(course => {
        const yearOffset = Math.floor((course.year_level - 1) / 2);
        const targetYear = startAcademicYear + yearOffset;
        const targetSem = (course.year_level % 2) === 0 ? 2 : 1;
        const key = `${targetYear}-${targetSem}`;
        if (!map[key]) map[key] = [];
        const isAlreadyPlanned = map[key].some(item => item.course_id === course.course_id);
        if (!isAlreadyPlanned) {
          map[key].push({
            plan_id: `compulsory-${course.course_id}`,
            course_id: course.course_id,
            course_name: course.course_name,
            credits: course.credits,
            type: '必修',
            isManual: false,
            academic_year: targetYear,
            semester: targetSem
          });
        }
      });
    }
    return map;
  }, [myPlan, allCourses, userDeptId]);

  const isCoursePlanned = useCallback((courseId) => myPlan.some(plan => plan.course_id === courseId), [myPlan]);
  
  const handleDragStart = (event) => {
    const courseId = Number(event.active.id.replace("course-", ""));
    setActiveDragItem(allCourses.find(c => c.course_id === courseId));
  };

  const handleDragEnd = async (event) => {
    const { active, over } = event;
    setActiveDragItem(null);
    if (!over) return;
    const courseId = Number(active.id.replace("course-", ""));
    const [yearStr, semStr] = over.id.split("-");
    try {
      await api.post("/plans", { course_id: courseId, academic_year: Number(yearStr), semester: Number(semStr) });
      toast.success("成功加入規劃！");
      setMyPlan((await api.get("/plans")).data);
    } catch (err) { toast.error(err.response?.data?.message || "加入失敗"); }
  };

  const promptRemovePlan = useCallback((planId, courseName) => setDeleteConfirmation({ isOpen: true, planId, courseName }), []);
  const cancelRemove = useCallback(() => setDeleteConfirmation({ isOpen: false, planId: null, courseName: "" }), []);
  const confirmRemovePlan = useCallback(async () => {
    const { planId } = deleteConfirmation;
    if (!planId) return;
    try {
      await api.delete(`/plans/${planId}`);
      toast.success("已移除");
      setMyPlan((await api.get("/plans")).data);
    } catch (err) { toast.error("移除失敗"); } finally { setDeleteConfirmation({ isOpen: false, planId: null, courseName: "" }); }
  }, [deleteConfirmation]);

  // 🔥 新增：處理模組一鍵匯入
  const handleImportModule = async (moduleId) => {
    setIsImportingModule(true);
    try {
        const userId = JSON.parse(localStorage.getItem("user_info"))?.id; 
        if (!userId) {
            toast.error("使用者資訊錯誤，請重新登入");
            return;
        }

        const res = await api.post("/plans/import-module", { userId, moduleId });
        
        if (res.data.addedCount > 0) {
            toast.success(res.data.message);
        } else {
            toast(`${res.data.message}`, { icon: 'ℹ️' });
        }
        
        // 匯入成功後，重新撈取規劃
        const planRes = await api.get("/plans");
        setMyPlan(planRes.data);
        
        // 關閉視窗
        setSelectedModule(null);
    } catch (err) {
        toast.error("匯入失敗: " + (err.response?.data?.error || "未知錯誤"));
    } finally {
        setIsImportingModule(false);
    }
  };

  return (
    <DndContext onDragStart={handleDragStart} onDragEnd={handleDragEnd}>
      <AnimatePresence mode="wait">
        {loading ? (
          // Loading Screen
          <motion.div key="loader" exit={{ opacity: 0 }} transition={{ duration: 0.5 }} className="fixed inset-0 z-[9999] bg-gray-50 flex flex-col items-center justify-center overflow-hidden">
             <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -z-10 animate-pulse"></div>
            <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full border border-gray-100">
              <div className="relative mb-6">
                <motion.div animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }} transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }} className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200"><AcademicCapIcon className="w-10 h-10 text-white" /></motion.div>
                <motion.div animate={{ scale: [0, 1, 0] }} transition={{ duration: 1.5, repeat: Infinity }} className="absolute -top-2 -right-2 bg-yellow-400 p-1.5 rounded-full shadow-sm"><SparklesIcon className="w-4 h-4 text-white" /></motion.div>
              </div>
              <h2 className="text-xl font-bold text-gray-800 mb-2 tracking-wide">正在準備課程資料...</h2>
              <p className="text-sm text-gray-500 mb-6 text-center">正在載入您的學期規劃與必修課程<br />請稍候片刻</p>
              <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden relative">
                <motion.div initial={{ x: "-100%" }} animate={{ x: "100%" }} transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }} className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"/>
                <motion.div className="h-full bg-blue-600 rounded-full" initial={{ width: "0%" }} animate={{ width: "80%" }} transition={{ duration: 0.8 }} />
              </div>
            </div>
            <p className="mt-8 text-xs text-gray-400 font-medium">POWERED BY REACT DND KIT</p>
          </motion.div>
        ) : (
          <motion.div key="content" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5, delay: 0.1 }} className="flex flex-col h-screen overflow-hidden bg-gray-100">
            <header className="bg-white border-b px-6 py-4 flex items-center shadow-sm z-10">
               <AcademicCapIcon className="h-8 w-8 text-blue-600 mr-3" />
               <h1 className="text-2xl font-bold text-gray-800">個人化修課路徑模擬</h1>
            </header>

            <div className="flex-1 flex overflow-hidden">
              
              {/* --- 左側 Sidebar --- */}
              <aside className="w-96 bg-white border-r flex flex-col shadow-lg z-10">
                  
                  {/* 🔥 修改：Tabs 切換區 (課程 vs 模組) */}
                  <div className="flex border-b bg-gray-50/50">
                    <button 
                      onClick={() => setActiveSidebarTab("courses")}
                      className={`flex-1 py-3 text-sm font-bold transition-all relative ${activeSidebarTab === 'courses' ? 'text-blue-600 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                      所有課程
                      {activeSidebarTab === 'courses' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-blue-600" />}
                    </button>
                    <button 
                      onClick={() => setActiveSidebarTab("modules")}
                      className={`flex-1 py-3 text-sm font-bold transition-all relative flex items-center justify-center gap-2 ${activeSidebarTab === 'modules' ? 'text-purple-600 bg-white' : 'text-gray-500 hover:text-gray-700 hover:bg-gray-100'}`}
                    >
                      <SparklesIcon className="h-4 w-4" />
                      推薦模組
                      {activeSidebarTab === 'modules' && <motion.div layoutId="tab-underline" className="absolute bottom-0 left-0 right-0 h-0.5 bg-purple-600" />}
                    </button>
                  </div>

                  {/* Sidebar 內容區 */}
                  {activeSidebarTab === 'courses' ? (
                      <>
                        {/* 搜尋與篩選 (維持不變) */}
                        <div className="p-4 border-b space-y-3 bg-white">
                            <div className="relative">
                                <MagnifyingGlassIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                                <input type="text" placeholder="搜尋課程..." className="w-full pl-10 pr-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-200 outline-none transition-all" value={search} onChange={(e) => setSearch(e.target.value)}/>
                            </div>
                            <div className="flex space-x-2">
                                <div className="relative flex-1">
                                    <FunnelIcon className="h-5 w-5 text-gray-400 absolute left-3 top-2.5" />
                                    <select className="w-full pl-10 pr-4 py-2 border rounded-lg appearance-none bg-white" value={filterDept} onChange={(e) => setFilterDept(e.target.value)}>
                                        <option value="all">所有系所</option>
                                        {departments.map(d => <option key={d.dept_id} value={d.dept_id}>{d.dept_name}</option>)}
                                    </select>
                                </div>
                                <select className="border rounded-lg px-3 py-2 bg-white" value={filterYearLevel} onChange={(e) => setFilterYearLevel(e.target.value)}>
                                    <option value="all">年級</option>
                                    <option value="1">大一上</option><option value="2">大一下</option>
                                    <option value="3">大二上</option><option value="4">大二下</option>
                                    <option value="5">大三上</option><option value="6">大三下</option>
                                    <option value="7">大四上</option><option value="8">大四下</option>
                                </select>
                            </div>
                        </div>
                        <SidebarList courses={filteredCourses} isPlannedFunc={isCoursePlanned} />
                      </>
                  ) : (
                      // 🔥 新增：模組列表介面
                      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50 scrollbar-thin">
                        <div className="p-4 bg-gradient-to-br from-purple-100 to-white rounded-xl border border-purple-100 shadow-sm">
                            <h4 className="font-bold text-purple-900 mb-1 flex items-center gap-2">
                                <MapIcon className="h-4 w-4" />
                                探索職涯路徑
                            </h4>
                            <p className="text-xs text-purple-700 leading-relaxed">不知道怎麼選？試試看這些為你量身打造的專業學程組合，系統將自動為你安排最佳修課學期。</p>
                        </div>
                        
                        {modules.length > 0 ? (
                            modules.map(mod => (
                                <ModuleItem key={mod.module_id} module={mod} onClick={setSelectedModule} />
                            ))
                        ) : (
                            <div className="text-center text-gray-400 py-10">
                                暫無推薦模組
                            </div>
                        )}
                      </div>
                  )}
              </aside>

              {/* 右側 Main (DroppableSemesters) 保持不變 */}
              <main className="flex-1 overflow-y-auto p-6 bg-gray-50">
                  <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-6">
                      {planStructure.map((slot) => {
                          const currentAcademicYear = startAcademicYear + slot.yearOffset;
                          const planKey = `${currentAcademicYear}-${slot.sem}`;
                          const coursesInThisSlot = structuredPlan[planKey] || [];
                          const totalCredits = coursesInThisSlot.reduce((sum, item) => sum + item.credits, 0);

                          return (
                            <DroppableSemester key={planKey} id={planKey} label={`${slot.label} (${currentAcademicYear})`} credits={totalCredits}>
                                {coursesInThisSlot.length === 0 ? (
                                    <div className="h-full flex items-center justify-center text-gray-400 text-sm border-2 border-dashed border-gray-200 rounded-lg">尚未規劃</div>
                                ) : (
                                    coursesInThisSlot.map(planItem => <PlanItem key={planItem.plan_id} item={planItem} onRemove={promptRemovePlan} />)
                                )}
                            </DroppableSemester>
                          )
                      })}
                  </div>
              </main>
            </div>

            {/* Drag Overlay */}
            <DragOverlay>
              {activeDragItem ? (
                 <div className="bg-white p-4 rounded-xl shadow-2xl border-2 border-blue-500 w-80 opacity-90 cursor-grabbing">
                    <h3 className="font-bold text-gray-800">{activeDragItem.course_name}</h3>
                    <div className="text-sm text-blue-600 mt-1">{activeDragItem.credits} 學分 (放開以加入)</div>
                 </div>
              ) : null}
            </DragOverlay>

            {/* 刪除確認視窗 */}
            <AnimatePresence>
              {deleteConfirmation.isOpen && (
                 <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={cancelRemove} className="absolute inset-0 bg-black/60" />
                  <motion.div initial={{ opacity: 0, scale: 0.95, y: 10 }} animate={{ opacity: 1, scale: 1, y: 0 }} exit={{ opacity: 0, scale: 0.95, y: 10 }} className="bg-white rounded-xl shadow-2xl w-full max-w-sm z-10 overflow-hidden">
                    <div className="p-6 text-center">
                      <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100 mb-4"><ExclamationTriangleIcon className="h-6 w-6 text-red-600" /></div>
                      <h3 className="text-lg font-bold text-gray-900">移除課程？</h3>
                      <p className="text-sm text-gray-500 mt-2">您確定要將「<span className="font-bold text-gray-700">{deleteConfirmation.courseName}</span>」從規劃中移除嗎？</p>
                    </div>
                    <div className="bg-gray-50 px-4 py-3 sm:px-6 flex gap-3">
                      <button onClick={cancelRemove} className="flex-1 py-2 bg-white border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50">取消</button>
                      <button onClick={confirmRemovePlan} className="flex-1 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">確定移除</button>
                    </div>
                  </motion.div>
                </div>
              )}
            </AnimatePresence>

            {/* 🔥 新增：模組預覽確認視窗 */}
            <AnimatePresence>
              {selectedModule && (
                  <ModulePreviewModal 
                      isOpen={!!selectedModule} 
                      module={selectedModule} 
                      onClose={() => setSelectedModule(null)}
                      onConfirm={handleImportModule}
                      isImporting={isImportingModule}
                  />
              )}
            </AnimatePresence>

          </motion.div>
        )}
      </AnimatePresence>
    </DndContext>
  );
}