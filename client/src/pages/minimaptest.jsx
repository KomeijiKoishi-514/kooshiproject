                        <motion.div
                          // 1. 啟用拖曳
                          drag
                          dragListener={false}       // 關閉預設全域拖曳，改由 Header 觸發
                          dragControls={dragControls} // 綁定控制器
                          dragMomentum={false}       // 取消慣性
  
                          // 2. 初始位置 (靠右下)
                          initial={{ x: 0, y: 0 }}
  
                          // 3. 外框樣式
                          // nopan: 加上這個 class，滑鼠在上面時就不會移動到底下的主地圖
                          className="nopan absolute z-50 right-6 bottom-24 shadow-xl rounded-lg border border-gray-300 bg-white w-64 pointer-events-auto overflow-hidden"
                        >
                          {/* ─── 標題列 (拖曳手把) ─── */}
                          <div 
                            onPointerDown={(e) => dragControls.start(e)} // 🔥 按住這裡才能拖曳
                            className="h-8 bg-gray-100 border-b border-gray-200 flex items-center justify-between px-3 cursor-move select-none hover:bg-gray-200 transition-colors"
                          >
                            <span className="text-xs font-bold text-gray-600 flex items-center gap-1">
                              <MapIcon className="w-3.5 h-3.5" />
                              導覽地圖
                            </span>
                            {/* 最小化/還原按鈕 */}
                            <button 
                              onPointerDown={(e) => e.stopPropagation()} // 阻止冒泡
                              onClick={() => setIsMiniMapMinimized(!isMiniMapMinimized)}
                              className="p-0.5 hover:bg-gray-300 rounded text-gray-500 transition-colors"
                            >
                              {isMiniMapMinimized ? <ArrowsPointingOutIcon className="w-3.5 h-3.5" /> : <MinusIcon className="w-3.5 h-3.5" />}
                            </button>
                          </div>

                          {/* ─── 動畫視窗 (負責遮罩) ─── */}
                          <motion.div
                            initial={false}
                            animate={{ height: isMiniMapMinimized ? 0 : 150 }} // 控制可見高度
                            style={{ overflow: 'hidden' }}
                            transition={{ duration: 0.3 }}
                          >
                            {/* ─── 固定高度容器 (負責修復灰色 BUG) ─── */}
                            <div className="h-[150px] w-full relative bg-gray-50">
      
                              {/* ✅ 這裡就是您原本的原生 MiniMap */}
                              <MiniMap 
                                pannable 
                                zoomable
                                style={{ height: '100%', width: '100%' }}
                                nodeColor={(n) => {
                                  if (n.data?.status === 'pass') return '#10b981';
                                  if (n.data?.status === 'ing') return '#f59e0b';
                                  if (n.data?.status === 'fail') return '#ef4444';
                                  return '#e5e7eb';
                                }}
                                maskColor="rgba(240, 240, 240, 0.6)"
                             />
      
                            </div>
                          </motion.div>
                        </motion.div>