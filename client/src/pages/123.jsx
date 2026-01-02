


                    <ReactFlow
                        nodes={nodes} edges={edges} nodeTypes={nodeTypes}
                        onNodesChange={onNodesChange} onEdgesChange={onEdgesChange}
                        fitView fitViewOptions={{ padding: 0.1 }} proOptions={{ hideAttribution: true }}
                        onMoveStart={handleInteraction} 
                        onPaneClick={handleInteraction}
                        onNodeClick={onNodeClick} 
                        onNodeContextMenu={onNodeContextMenu}
                    >
                        {/* ❌ 移除原本的 MiniMap */}
                        {/* <MiniMap style={{ ... }} /> */}

                        {/* ✅ 加入新的懸浮地圖 */}
                        <FloatingMiniMap />

                        {/* Controls 維持你原本修改好的樣子 */}
                        <Controls 
                            className="react-flow__controls-override"
                            style={{
                            display: 'flex',
                            flexDirection: 'column', // 確保按鈕是直排
                            width: 'fit-content',
                            height: 'fit-content',
                            minWidth: '32px',         // 給一個最小寬度，避免按鈕太擠
    
                            position: 'absolute',
                            bottom: 100, 
                            right: isInfoPanelCollapsed ? 20 : 340, 
                            transition: 'right 0.3s',
    
                            // 外觀設定
                            backgroundColor: '#ffffff',
                            border: '1px solid #e5e7eb',
                            borderRadius: '8px',
                            boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1)',
                            padding: '4px',           // 內距，讓按鈕不要貼死邊框
                            zIndex: 10                // 確保浮在地圖之上
                          }} 
                            showInteractive={false} 
                        />
                    </ReactFlow>