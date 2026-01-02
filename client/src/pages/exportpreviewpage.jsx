// client/src/pages/ExportPreviewPage.jsx

import React, { useEffect, useState, useRef, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import api from "../api/axiosConfig";
import ExportMapTemplate from "../components/ExportMapTemplate";
import html2canvas from "html2canvas";
import toast from "react-hot-toast";
import { AnimatePresence,motion } from "framer-motion";
import { 
  ArrowLeftIcon, 
  ArrowDownTrayIcon, 
  MapIcon, 
  SparklesIcon 
} from "@heroicons/react/24/solid";

export default function ExportPreviewPage() {
  const { deptId } = useParams(); // 從網址取得系所 ID
  const navigate = useNavigate();
  const printRef = useRef();
  
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isExporting, setIsExporting] = useState(false);

  // 1. 載入資料
// 1. 載入資料 (包含強制等待效果)
  useEffect(() => {
    if (!deptId) return;
    setLoading(true);
    // 定義一個 1.5 秒的計時器 (您可以依喜好調整時間)
    const minLoadingTime = new Promise(resolve => setTimeout(resolve, 1500));
    // 原始的 API 請求
    const dataRequest = api.get(`/curriculum/${deptId}`);
    // 使用 Promise.all 同時等待「資料」與「時間」
    Promise.all([dataRequest, minLoadingTime])
      .then(([res]) => {
        // res 是陣列的第一個元素 (dataRequest 的結果)
        setCourses(res.data.courses || []);
      })
      .catch((err) => {
        console.error(err);
        toast.error("載入課程資料失敗");
      })
      .finally(() => {
        // 兩個都完成後，才會執行這裡，確保 Loading 至少顯示 1.5 秒
        setLoading(false);
      });
  }, [deptId]);

  // 2. 計算分類 (邏輯與主地圖相同)
  const categories = useMemo(() => {
    const uniqueCats = new Set();
    courses.forEach(c => {
      if (Array.isArray(c.categories)) {
        c.categories.forEach(cat => uniqueCats.add(cat));
      } else if (c.category) {
        uniqueCats.add(c.category);
      }
    });

    // 定義排序權重
    const getPriority = (catName) => {
      if (catName.includes("校定必修")) return 1;
      if (catName.includes("院定必修")) return 2;
      if (catName.includes("系定必修")) return 3;
      if (catName.includes("系定選修")) return 4;
      return 10;
    };

    const sorted = Array.from(uniqueCats).sort((a, b) => getPriority(a) - getPriority(b));
    return sorted.map(cat => ({ id: cat, name: cat }));
  }, [courses]);

  // 3. 執行下載 (html2canvas)
  const handleDownload = async () => {
    if (!printRef.current) return;
    setIsExporting(true);
    const toastId = toast.loading("正在產生高解析度圖片...");

    try {
      // 延遲一下確保渲染完成
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const canvas = await html2canvas(printRef.current, { 
        scale: 2, // 2倍解析度，保持清晰
        useCORS: true, 
        backgroundColor: '#ffffff',
        logging: false
      });
      
      const image = canvas.toDataURL("image/png");
      const link = document.createElement("a");
      link.href = image;
      link.download = `學程地圖_${deptId}_${new Date().getTime()}.png`;
      link.click();
      toast.success("下載完成", { id: toastId });
    } catch (err) {
      console.error(err);
      toast.error("匯出失敗", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

return (
    // 使用 mode="wait" 確保 Loading 完全淡出後，內容才開始淡入
    <AnimatePresence mode="wait">
      
      {/* 🟢 狀態 A: Loading 畫面 */}
      {loading ? (
        <motion.div
          key="loader"
          // 定義退場動畫：淡出 (opacity: 0)
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }} // 淡出花費 0.5 秒
          className="min-h-screen bg-gray-50 flex flex-col items-center justify-center relative overflow-hidden fixed inset-0 z-50"
        >
          {/* ... 這裡放您原本設計好的漂亮 Loading UI ... */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-blue-100/50 rounded-full blur-3xl -z-10 animate-pulse"></div>
          <div className="bg-white p-8 rounded-2xl shadow-xl flex flex-col items-center max-w-sm w-full border border-gray-100">
            <div className="relative mb-6">
              <motion.div
                animate={{ scale: [1, 1.1, 1], rotate: [0, 5, -5, 0] }}
                transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
                className="w-20 h-20 bg-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-200"
              >
                <MapIcon className="w-10 h-10 text-white" />
              </motion.div>
              <motion.div 
                animate={{ scale: [0, 1, 0] }}
                transition={{ duration: 1.5, repeat: Infinity }}
                className="absolute -top-2 -right-2 bg-yellow-400 p-1.5 rounded-full shadow-sm"
              >
                <SparklesIcon className="w-4 h-4 text-white" />
              </motion.div>
            </div>
            <h2 className="text-xl font-bold text-gray-800 mb-2 tracking-wide">正在繪製地圖...</h2>
            <p className="text-sm text-gray-500 mb-6 text-center">正在整理課程關聯與學分資料<br />請稍候片刻</p>
            <div className="w-full h-2 bg-gray-100 rounded-full overflow-hidden relative">
              <motion.div
                initial={{ x: "-100%" }}
                animate={{ x: "100%" }}
                transition={{ duration: 1.5, repeat: Infinity, ease: "linear" }}
                className="absolute top-0 left-0 w-1/2 h-full bg-gradient-to-r from-transparent via-blue-500 to-transparent opacity-50"
              />
              <motion.div className="h-full bg-blue-600 rounded-full" initial={{ width: "0%" }} animate={{ width: "80%" }} transition={{ duration: 0.8 }} />
            </div>
          </div>
          <p className="mt-8 text-xs text-gray-400 font-medium">POWERED BY REACT FLOW & HTML2CANVAS</p>
        </motion.div>
      ) : (
        
        /* 🔵 狀態 B: 主內容頁面 (預覽頁) */
        <motion.div
          key="content"
          // 定義進場動畫：淡入 + 稍微往上浮現
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }} // 稍微延遲一點點，感覺更順暢
          className="min-h-screen bg-gray-100 flex flex-col"
        >
          {/* --- 頂部工具列 --- */}
          <div className="bg-white shadow-md px-6 py-4 flex justify-between items-center z-50 sticky top-0">
             {/* ... 工具列內容保持不變 ... */}
             <div className="flex items-center gap-4">
                <button onClick={() => navigate(-1)} className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors">
                    <ArrowLeftIcon className="w-5 h-5" /> 返回地圖
                </button>
                <h1 className="text-xl font-bold text-gray-800 border-l pl-4 border-gray-300">匯出預覽模式</h1>
             </div>
             <div className="flex items-center gap-3">
                <span className="text-sm text-gray-500 mr-2">提示：如果版面跑掉，請按 F12 調整 ExportMapTemplate 的 CSS</span>
                <button onClick={handleDownload} disabled={isExporting} className={`flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-white shadow-lg transition-all ${isExporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'}`}>
                    <ArrowDownTrayIcon className="w-5 h-5" />
                    {isExporting ? "處理中..." : "確認並下載圖片"}
                </button>
             </div>
          </div>

          {/* --- 預覽區域 --- */}
          <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
            <div className="shadow-2xl border-4 border-white ring-1 ring-gray-200">
                <ExportMapTemplate ref={printRef} courses={courses} categories={categories} />
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* --- 頂部工具列 --- */}
      <div className="bg-white shadow-md px-6 py-4 flex justify-between items-center z-50 sticky top-0">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate(-1)} 
            className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
          >
            <ArrowLeftIcon className="w-5 h-5" />
            返回地圖
          </button>
          <h1 className="text-xl font-bold text-gray-800 border-l pl-4 border-gray-300">
            匯出預覽模式
          </h1>
        </div>
        
        <div className="flex items-center gap-3">
            <span className="text-sm text-gray-500 mr-2">
                提示：如果版面跑掉，請按 F12 調整 ExportMapTemplate 的 CSS
            </span>
            <button
                onClick={handleDownload}
                disabled={isExporting}
                className={`
                    flex items-center gap-2 px-6 py-2.5 rounded-full font-bold text-white shadow-lg transition-all
                    ${isExporting ? 'bg-gray-400 cursor-not-allowed' : 'bg-blue-600 hover:bg-blue-700 hover:-translate-y-0.5'}
                `}
            >
                <ArrowDownTrayIcon className="w-5 h-5" />
                {isExporting ? "處理中..." : "確認並下載圖片"}
            </button>
        </div>
      </div>

      {/* --- 預覽區域 (置中顯示) --- */}
      <div className="flex-1 overflow-auto p-8 flex justify-center items-start">
        <div className="shadow-2xl border-4 border-white ring-1 ring-gray-200">
             {/* 這裡直接渲染 Template 
                 注意：因為 ExportMapTemplate 本身有寫 w-[1800px]，
                 所以這裡不需要再給寬度，讓它自然撐開 
             */}
            <ExportMapTemplate 
                ref={printRef} 
                courses={courses} 
                categories={categories} 
            />
        </div>
      </div>
    </div>
  );
}