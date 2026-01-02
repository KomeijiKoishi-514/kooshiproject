import React, { forwardRef } from 'react';

const ExportMapTemplate = forwardRef(({ courses, categories }, ref) => {
  
  const timelines = [
    { year: '一年級', semesters: ['上學期', '下學期'] },
    { year: '二年級', semesters: ['上學期', '下學期'] },
    { year: '三年級', semesters: ['上學期', '下學期'] },
    { year: '四年級', semesters: ['上學期', '下學期'] },
  ];

  // ==========================================
  // 1. 定義顏色樣式
  // ==========================================
  const getCategoryColor = (catName) => {
    if (catName.includes("校定必修")) return "bg-red-500 border-red-300";
    if (catName.includes("院定必修")) return "bg-amber-500 border-amber-300";
    if (catName.includes("系定必修")) return "bg-emerald-500 border-emerald-300";
    if (catName.includes("選修")) return "bg-blue-500 border-blue-300";
    return "bg-gray-500 border-gray-300";
  };

  const getLightBgColor = (catName) => {
    if (catName.includes("校定")) return "bg-red-50";
    if (catName.includes("院定")) return "bg-amber-50";
    if (catName.includes("系定")) return "bg-emerald-50";
    if (catName.includes("選修")) return "bg-blue-50";
    return "bg-gray-50";
  };

  // ==========================================
  // 2. 定義排序權重
  // ==========================================
  const getCategoryPriority = (courseCats) => {
    if (!courseCats || courseCats.length === 0) return 99;
    if (courseCats.includes("校定必修")) return 1;
    if (courseCats.includes("院定必修")) return 2;
    if (courseCats.includes("系定必修")) return 3;
    if (courseCats.includes("系定選修")) return 4;
    return 10;
  };

  // ==========================================
  // 3. 篩選與排序
  // ==========================================
  const getCourses = (catName, yearLabel, semLabel) => {
    const yearBaseMap = { '一年級': 0, '二年級': 2, '三年級': 4, '四年級': 6 };
    const semOffsetMap = { '上學期': 1, '下學期': 2 };
    const targetLevel = yearBaseMap[yearLabel] + semOffsetMap[semLabel];
    
    const filtered = courses.filter(c => {
      const hasCategory = c.categories && c.categories.includes(catName);
      const isLevelMatch = Number(c.year_level) === targetLevel;
      return hasCategory && isLevelMatch;
    });

    return filtered.sort((a, b) => {
       const pA = getCategoryPriority(a.categories);
       const pB = getCategoryPriority(b.categories);
       if(pA !== pB) return pA - pB;
       return a.course_id - b.course_id;
    });
  };

  return (
    // 外容器
    <div ref={ref} className="w-[1800px] bg-white p-10 font-sans text-gray-800 absolute top-0 left-0">
      
      <h1 className="text-4xl font-bold text-center mb-8 text-blue-900 tracking-wider">
        課程地圖總覽
      </h1>

      {/* Grid 佈局 */}
      <div className="grid grid-cols-[120px_repeat(8,_1fr)] gap-y-2 gap-x-1 border-2 border-gray-100 bg-white p-4 rounded-xl shadow-sm">

        {/* --- 表頭 --- */}
        <div className="row-span-2 bg-gray-50 rounded-tl-lg"></div>

        {/* 年級 Row - 改用 Flex 置中 */}
        {timelines.map((t, i) => (
          <div key={i} className="col-span-2 flex items-center justify-center py-3 bg-[#d4e157] font-bold text-xl text-gray-800 rounded-t-md mx-0.5">
            {t.year}
          </div>
        ))}

        {/* 學期 Row - 改用 Flex 置中 */}
        {timelines.map((t) => (
          t.semesters.map((s) => (
            <div key={`${t.year}-${s}`} className="flex items-center justify-center py-2 bg-[#e6ee9c] text-base font-medium text-gray-700 mx-0.5 last:rounded-tr-md">
              {s}
            </div>
          ))
        ))}

        {/* --- 內容 Rows --- */}
        {categories.map((cat) => {
          const lightBg = getLightBgColor(cat.name);

          return (
            <React.Fragment key={cat.id}>
              {/* 左側：分類標題 */}
              {/* 加入 h-full 確保填滿高度，並用 Flex 強制置中 */}
              <div 
                className={`
                  flex items-center justify-center h-full
                  text-xl font-bold tracking-widest text-gray-700
                  rounded-l-md border-r-2 border-gray-200 shadow-sm
                  ${lightBg}
                  py-6
                `}
                style={{ writingMode: 'vertical-lr', textOrientation: 'upright' }} 
              >
                {cat.name}
              </div>

              {/* 右側：課程格子 */}
              {timelines.map((t) => 
                t.semesters.map((s) => {
                  const currentCourses = getCourses(cat.name, t.year, s);

                  return (
                    <div 
                      key={`${cat.id}-${t.year}-${s}`} 
                      className={`
                        relative 
                        min-h-[200px]      /* 保持最小高度，確保視覺一致 */
                        h-full             /* 跟隨同一列最高的格子自動長高 */
                        border-l border-dashed border-gray-200 
                        ${lightBg}
                        p-2                /* 內距 */
                        flex flex-col items-center justify-start /* 🔥 關鍵：垂直置中 */
                      `}
                    >
                      {/* 內容容器：
                         1. 改回 flex-col (單欄垂直排列)
                         2. 寬度設為 w-full 確保方塊整齊
                         3. 移除 absolute，讓內容撐開父容器高度 (解決爆開問題)
                      */}
                      <div className="w-full flex flex-col gap-2 items-center">
                        
                        {currentCourses.map(course => (
                          <div 
                            key={course.course_id}
                            className={`
                              w-full 
                              flex items-center justify-center text-center
                              px-2 py-3 rounded-lg shadow-sm 
                              text-base font-bold text-white /* 維持原本的字體大小 */
                              ${getCategoryColor(cat.name).split(' ')[0]} 
                              cursor-default
                              min-h-[44px] /* 固定高度，視覺更整齊 */
                            `}
                          >
                            {/* 加入 line-clamp 避免極端長課名破壞版面，但通常會自動換行 */}
                            <span className="leading-tight">
                              {course.course_name}
                            </span>
                          </div>
                        ))}

                      </div>
                    </div>
                  );
                })
              )}
            </React.Fragment>
          );
        })}

      </div>

      <div className="mt-6 text-right text-gray-400 text-sm">
        匯出日期：{new Date().toLocaleDateString()}
      </div>
    </div>
  );
});

export default ExportMapTemplate;