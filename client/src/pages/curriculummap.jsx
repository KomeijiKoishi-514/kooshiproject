// client/src/pages/CurriculumMap.jsx
import React, { useEffect, useState, useCallback, memo, useRef, useMemo } from "react";
import ReactFlow, {
  MiniMap,
  Controls,
  Handle,
  Position,
  NodeToolbar,
  ReactFlowProvider,
} from "reactflow";
import FlowErrorBoundary from "../components/FlowErrorBoundary";
import { motion, AnimatePresence } from "framer-motion";
import "reactflow/dist/style.css";
import api from "../api/axiosConfig";
import html2canvas from "html2canvas";
import ExportMapTemplate from "../components/ExportMapTemplate"; // 引入匯出模板

// =========================================================
// 分類顏色
// =========================================================
function categoryColor(cat) {
  if (!cat) return "#6b7280"; // 預設灰
  if (cat.includes("校定必修")) return "#ef4444"; // 紅
  if (cat.includes("院定必修")) return "#f59e0b"; // 橘
  if (cat.includes("系定必修")) return "#10b981"; // 綠
  if (cat.includes("選修")) return "#3b82f6";     // 藍
  return "#6b7280"; 
}

// =========================================================
// Custom Node Component
// =========================================================
const CustomNode = memo(({ data }) => {
  const course = data.course;
  const firstCat = course.categories?.[0] || null;
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div
      className="relative group select-none"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      <NodeToolbar
        isVisible={isHovered}
        position={Position.Right}
        offset={10}
      >
        <div className="bg-white text-black text-sm p-3 rounded shadow-lg w-56 pointer-events-none">
          <div className="font-semibold text-base mb-1">{course.course_name}</div>
          <div className="text-gray-700">學分：{course.credits}</div>
          <div className="text-gray-700">時段：{course.year_text}</div>
          {/*<div className="text-gray-700">學期：{course.semester || "未指定"}</div>*/}
          <div className="mt-2">
            <div className="text-gray-600 text-sm mb-1">分類：</div>
            <div className="flex flex-wrap gap-1">
              {(course.categories || []).map((cat, i) => (
                <span
                  key={i}
                  className="px-2 py-1 rounded text-xs text-white"
                  style={{ background: categoryColor(cat) }}
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>
        </div>
      </NodeToolbar>

      {/* 主卡片 */}
      <div
        className="rounded-lg shadow-md text-white px-3 py-2 cursor-pointer border"
        style={{
          width: 200,
          background: firstCat ? categoryColor(firstCat) : "#6b7280",
          borderColor: "#ffffff33",
        }}
      >
        <div className="font-semibold">{course.course_name}</div>
        <div className="text-sm opacity-90">{course.credits} 學分</div>

        <div className="flex flex-wrap gap-1 mt-1">
          {(course.categories || []).map((cat, i) => (
            <span
              key={i}
              className="px-1 py-[2px] rounded text-xs"
              style={{
                background: "#ffffff33",
                border: "1px solid rgba(255,255,255,0.4)",
              }}
            >
              {cat}
            </span>
          ))}
        </div>
      </div>

      <Handle type="target" position={Position.Top} />
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

//  node優先級設定
function getCategoryPriority(categories) {
  if (!categories || categories.length === 0) return 99;
  const priorities = categories.map(cat => {
    if (cat.includes("校定必修")) return 1; // 紅 (對應 DB ID 3)
    if (cat.includes("院定必修")) return 2; // 橘 (對應 DB ID 4)
    if (cat.includes("系定必修")) return 3; // 綠 (對應 DB ID 1)
    if (cat.includes("系定選修")) return 4; // 藍 (對應 DB ID 2)
    return 10;
  });
  return Math.min(...priorities);
}

// =========================================================
// 主組件 CurriculumMap
// =========================================================
export default function CurriculumMap() {
  const [depts, setDepts] = useState([]);
  const [deptId, setDeptId] = useState(510); // 目前只支援510

  const [nodes, setNodes] = useState([]);
  const [edges, setEdges] = useState([]);
  
  // 新增：保存原始課程資料給匯出模板使用
  const [rawCourses, setRawCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isInfoPanelCollapsed, setIsInfoPanelCollapsed] = useState(true);

  // 新增：匯出相關 State 與 Ref
  const exportRef = useRef();
  const [isExporting, setIsExporting] = useState(false);

  // 控制導覽遮罩顯示 (預設開啟)
  const [showGuide, setShowGuide] = useState(true);
  // 只要使用者跟地圖互動，就關閉導覽
  const handleInteraction = useCallback(() => {
    if (showGuide) {
      setShowGuide(false);
    }
  }, [showGuide])

  const nodeTypes = useMemo(() => ({ customNode: CustomNode }), []);

  const toggleInfoPanel = () => {
    setIsInfoPanelCollapsed(!isInfoPanelCollapsed);
  };

  // 取得系所
  useEffect(() => {
    api.get("/departments").then((res) => {
      setDepts(res.data || []);
    });
  }, []);
  const fetchCurriculum = useCallback(async () => {
    if (!deptId) return;
    setLoading(true);
    try {
      const res = await api.get(`/curriculum/${deptId}`);
      const { courses, prerequisites } = res.data;
      setRawCourses(courses);

      // 依年級分組
      const groups = {};
      courses.forEach((c) => {
        const rowKey = c.year_level || 999;
        if (!groups[rowKey]) groups[rowKey] = [];
        groups[rowKey].push(c);
      });

      const sortedYears = Object.keys(groups).map(Number).sort((a, b) => a - b);

      // =====================================================
      // 先掃描全域，計算每個顏色的「最大佔用格數」
      // =====================================================
      let maxP1 = 0; // 紅色 (校定) 最多幾堂
      let maxP2 = 0; // 橘色 (院定) 最多幾堂
      let maxP3 = 0; // 綠色 (系定) 最多幾堂
      // P4 (選修) 排最後，不需計算推擠

      sortedYears.forEach((year) => {
        const rowCourses = groups[year];
        // 計算該學期各分類的數量
        const countP1 = rowCourses.filter(c => getCategoryPriority(c.categories) === 1).length;
        const countP2 = rowCourses.filter(c => getCategoryPriority(c.categories) === 2).length;
        const countP3 = rowCourses.filter(c => getCategoryPriority(c.categories) === 3).length;

        // 紀錄全場最大值 (例如：大一上紅色有3堂，那 maxP1 就是 3)
        maxP1 = Math.max(maxP1, countP1);
        maxP2 = Math.max(maxP2, countP2);
        maxP3 = Math.max(maxP3, countP3);
      });

      // 為了美觀，如果某個分類完全沒課，可以設最小寬度 (例如 0 或 1)
      // 這裡直接用計算值，確保緊湊但分區明確
      
      const H_GAP = 260; 
      const V_GAP = 180;
      
      // 定義各區域的「絕對起始座標」
      // 紅色區：從 0 開始
      // 橘色區：從 (紅色最大寬度) 開始
      // 綠色區：從 (紅色 + 橘色) 開始
      const startX_P1 = 0;
      const startX_P2 = maxP1 * H_GAP;
      const startX_P3 = (maxP1 + maxP2) * H_GAP;
      const startX_P4 = (maxP1 + maxP2 + maxP3) * H_GAP;
      const nodeList = [];

      // =====================================================
      // 產生節點 (依照固定區域計算 X)
      // =====================================================
      sortedYears.forEach((year, rowIndex) => {
        const rowCourses = groups[year];

        // 該行內部的計數器 (用來算該顏色排到第幾個了)
        let currentP1 = 0;
        let currentP2 = 0;
        let currentP3 = 0;
        let currentP4 = 0;

        // 先排序 (確保 ID 小的在左邊，且同顏色聚在一起)
        rowCourses.sort((a, b) => {
          const pA = getCategoryPriority(a.categories);
          const pB = getCategoryPriority(b.categories);
          if (pA !== pB) return pA - pB;
          if (a.dept_id !== b.dept_id) return a.dept_id - b.dept_id;
          return a.course_id - b.course_id;
        });

        rowCourses.forEach((c) => {
          const priority = getCategoryPriority(c.categories);
          let posX = 0;

          // 依照權重分配

          // 紅(校定必修)
          if (priority === 1) { 
              posX = startX_P1 + (currentP1 * H_GAP);
              currentP1++;
          // 橘(院定必修)
          } else if (priority === 2) { 
              posX = startX_P2 + (currentP2 * H_GAP);
              currentP2++;
          // 綠(系定必修)
          } else if (priority === 3) { 
              posX = startX_P3 + (currentP3 * H_GAP);
              currentP3++;
          // 藍(系選修)或其他...
          } else { 
              posX = startX_P4 + (currentP4 * H_GAP);
              currentP4++;
          }

          nodeList.push({
            id: String(c.course_id),
            type: "customNode",
            data: { course: c },
            position: {
              x: posX,
              y: rowIndex * V_GAP,
            },
          });
        });
      });

      const edgeList = prerequisites.map((p) => ({
        id: `e${p.prereq_id}-${p.course_id}`,
        source: String(p.prereq_id),
        target: String(p.course_id),
        animated: true,
        type: "smoothstep",
      }));

      setNodes(nodeList);
      setEdges(edgeList);
    } catch (error) {
      console.error("Fetch curriculum error:", error);
    } finally {
      setLoading(false);
    }
  }, [deptId]);

  useEffect(() => {
    fetchCurriculum();
  }, [fetchCurriculum]);


  // =========================================================
  // 新增：匯出功能邏輯
  // =========================================================
  
  // 自動從課程中提取所有出現過的 "分類" (給矩陣圖的 Y 軸使用)
  const exportCategories = useMemo(() => {
    const uniqueCats = new Set();
    rawCourses.forEach(c => {
      if (Array.isArray(c.categories)) {
        c.categories.forEach(cat => uniqueCats.add(cat));
      } else if (c.category) {
        uniqueCats.add(c.category);
      }
    });
    // 轉成物件陣列 { id: '分類名', name: '分類名' }
    return Array.from(uniqueCats).map(cat => ({ id: cat, name: cat }));
  }, [rawCourses]);
  //  ------------------------------------------
  //  匯出圖片
  //  ------------------------------------------
  const handleExportImage = async () => {
    if (!exportRef.current) return;
    setIsExporting(true);

    try {
      // 等待 React 渲染
      await new Promise(resolve => setTimeout(resolve, 100));

      const canvas = await html2canvas(exportRef.current, {
        scale: 2, // 2倍解析度
        useCORS: true,
        backgroundColor: '#ffffff',
      });

      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `學程地圖_${deptId}_${new Date().getTime()}.png`;
      link.click();
    } catch (err) {
      console.error("匯出失敗:", err);
      alert("匯出圖片時發生錯誤，請檢查 console");
    } finally {
      setIsExporting(false);
    }
  };


  // =========================================================
  // Render
  // =========================================================
  return (
    <div className="flex h-full bg-gray-100">
      {/* 左側：學程圖區域 */}
      <div className="flex-1 p-4 flex flex-col">
        {/* 上方工具列 */}
        <div className="flex items-center justify-between mb-4 flex-shrink-0">
          <div className="flex items-center space-x-2">
            {/* 系所選擇 */}
            <select
              className="border p-2 rounded shadow-sm focus:outline-none focus:ring-2 focus:ring-blue-400"
              value={deptId}
              onChange={(e) => setDeptId(e.target.value)}
            >
              {depts.map((d) => (
                <option key={d.dept_id} value={d.dept_id}>
                  {d.dept_name}
                </option>
              ))}
            </select>

            {/* 新增：匯出按鈕 */}
            <button
              onClick={handleExportImage}
              disabled={isExporting || loading}
              className={`px-4 py-2 rounded text-white shadow-sm transition-colors ${
                isExporting 
                  ? "bg-gray-400 cursor-not-allowed" 
                  : "bg-blue-600 hover:bg-blue-700"
              }`}
            >
              {isExporting ? "處理中..." : "匯出圖片 (PNG)"}
            </button>
          </div>
        </div>

        {/* ReactFlow 畫布 */}
        <div className="relative bg-white rounded shadow flex-1 overflow-hidden">
          <ReactFlowProvider>
            <FlowErrorBoundary>
              <AnimatePresence>
                {loading && (
                  <motion.div
                    key="loader"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    exit={{ opacity: 0 }}
                    className="absolute inset-0 flex justify-center items-center bg-white/60 z-10"
                  >
                    <div className="text-lg font-bold text-gray-600">載入中…</div>
                  </motion.div>
                )}
              </AnimatePresence>

              <AnimatePresence>
                {!loading && (
                  <motion.div
                    key="reactflow"
                    className="absolute inset-0"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.5 }}
                  >
                    <ReactFlow
                      nodes={nodes} edges={edges}
                      nodeTypes={nodeTypes} fitView
                      fitViewOptions={{ padding: 0.3 }}
                      proOptions={{ hideAttribution: true }}
  
                      // 3綁定互動事件：一動就消失
                      onMoveStart={handleInteraction} // 拖曳畫布開始時
                      onPaneClick={handleInteraction} // 點擊空白處時
                      onNodeClick={(e, node) => {     // 點擊節點時
                      handleInteraction();          // 先關閉導覽

                        // 原本的點擊邏輯
                        const clickedCourse = node.data.course;
                        if (selectedCourse && selectedCourse.course_id === clickedCourse.course_id) {
                          toggleInfoPanel();
                        } else {
                          setSelectedCourse(clickedCourse);
                          setIsInfoPanelCollapsed(false);
                        }
                      }}
                    >
                    <MiniMap/>
                    <Controls/>
                    </ReactFlow>
                    {/* 首次進入的年級導覽遮罩 */}
                    <AnimatePresence>
                      {showGuide && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          transition={{ duration: 0.5 }}
                          // pointer-events-none 確保滑鼠可以直接穿透遮罩去操作地圖
                          className="absolute inset-0 z-50 flex items-center justify-center pointer-events-none bg-black/10 backdrop-blur-[2px]"
                        >
                          <div className="flex flex-col items-center space-y-8">
        
                            {/* 提示文字 */}
                            <div className="bg-white/90 px-6 py-3 rounded-full shadow-xl border border-blue-200 mb-4 animate-bounce">
                              <p className="text-blue-800 font-bold text-lg flex items-center gap-2">
                                 拖曳或滾動以探索學程
                              </p>
                            </div>

                            {/* 年級標示軸 */}
                            <div className="relative flex flex-col items-center space-y-12">
                              {/* 背景虛線 */}
                              <div className="absolute top-4 bottom-4 w-1 border-l-4 border-dashed border-white/60 -z-10 h-full"></div>

                              {["一年級", "二年級", "三年級", "四年級"].map((year, idx) => (
                                <div key={year} className="flex items-center space-x-4">
                                   {/* 左側標籤 */}
                                   <div className={`
                                     px-6 py-2 rounded-lg shadow-lg text-white font-bold text-xl
                                     ${idx === 0 ? "bg-red-500" : 
                                       idx === 1 ? "bg-orange-400" : 
                                       idx === 2 ? "bg-green-500" : "bg-blue-500"}
                                   `}>
                                     {year}
                                   </div>
                                   {/* 右側說明 (選填) */}
                                   {idx === 0 && <span className="text-white font-bold text-shadow text-sm">基礎課程</span>}
                                   {idx === 3 && <span className="text-white font-bold text-shadow text-sm">畢業專題</span>}
                                </div>
                              ))}
                            </div>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </FlowErrorBoundary>
          </ReactFlowProvider>
        </div>
      </div>

      {/* 右側：側邊資訊欄 */}
      <motion.div
        initial={{ x: "100%" }}
        animate={{ x: "0%" }}
        transition={{ type: "spring", stiffness: 300, damping: 30 }}
        className={`bg-white border-l p-4 shadow-lg overflow-y-auto overflow-x-hidden 
          ${isInfoPanelCollapsed ? "w-16" : "w-96"} 
          transition-all duration-300 ease-in-out flex flex-col`}
      >
        <button
          onClick={toggleInfoPanel}
          className="p-2 rounded hover:bg-gray-200 mb-4 self-end flex-shrink-0"
        >
          {isInfoPanelCollapsed ? "←" : "→"}
        </button>

        <div
          className={`whitespace-nowrap overflow-hidden transition-all duration-300 ${
            isInfoPanelCollapsed ? "w-0 opacity-0" : "w-full opacity-100"
          }`}
        >
          {selectedCourse ? (
            <div className="space-y-4">
              <div 
                className="pl-3 border-l-4"
                style={{ 
                  // 取第一個分類的顏色作為主色調
                  borderColor: categoryColor(selectedCourse.categories?.[0]) 
                }}
              >
                <h2 className="text-xl font-bold text-gray-800">
                  {selectedCourse.course_name}
                </h2>
                <span 
                  className="text-xs font-bold px-2 py-0.5 rounded text-white inline-block mt-1"
                  style={{ background: categoryColor(selectedCourse.categories?.[0]) }}
                >
                  {/* 顯示主分類名稱 */}
                  {selectedCourse.categories?.[0] || "未分類"}
                </span>
              </div>
              
              <div className="bg-gray-50 p-3 rounded-lg space-y-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                   <span className="text-gray-500">學分</span>
                   <span className="font-medium">{selectedCourse.credits}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                   <span className="text-gray-500">時段</span>
                   <span className="font-medium">{selectedCourse.year_text}</span>
                </div>
              </div>

              <div>
                <div className="text-gray-500 text-sm mb-2">所有分類標籤：</div>
                <div className="flex flex-wrap gap-2">
                  {(selectedCourse.categories || []).map((cat, i) => (
                    <span
                      key={i}
                      className="px-2 py-1 rounded-full text-xs text-white shadow-sm"
                      style={{ background: categoryColor(cat) }}
                    >
                      {cat}
                    </span>
                  ))}
                </div>
              </div>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-64 text-gray-400">
              <svg className="w-12 h-12 mb-2 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
              <p>點擊左側課程節點<br/>查看詳細資訊</p>
            </div>
          )}
        </div>
      </motion.div>

      {/* ========================================================= */}
      {/* 隱藏的匯出模板 (Render 在 DOM 中但移出可視範圍) */}
      {/* ========================================================= */}
      <div style={{ position: "fixed", top: "-10000px", left: "-10000px", zIndex: -1 }}>
        <ExportMapTemplate 
            ref={exportRef}
            courses={rawCourses}
            categories={exportCategories}
        />
      </div>
    </div>
  );
}