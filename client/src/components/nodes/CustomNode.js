import React from "react";
import { Handle, Position } from "reactflow";
import { createPortal } from "react-dom";

export default function CustomNode({ data }) {
  const tooltipRoot = document.getElementById("tooltip-root");

  const categoryColor = (cat) => {
    switch (cat) {
      case "系定必修":
        return "#d7263d";
      case "系上選修":
        return "#1b998b";
      case "校定必修":
        return "#2d7dd2";
      case "院定必修":
        return "#f4a261";
      default:
        return "#888";
    }
  };

  return (
    <>
      {/* Node 本體 */}
      <div
        className="px-4 py-2 rounded shadow text-white relative cursor-pointer group"
        style={{
          background: categoryColor(data.categories?.[0]),
        }}
      >
        <div className="font-semibold">{data.label}</div>
        <div className="text-xs opacity-80">{data.credits} 學分</div>

        <Handle type="target" position={Position.Top} />
        <Handle type="source" position={Position.Bottom} />
      </div>

      {/* Tooltip（Portal 渲染，永不被遮住） */}
      {data.tooltipPos &&
        tooltipRoot &&
        data.hover &&
        createPortal(
          <div
            className="fixed z-[999999] bg-white text-black text-sm p-3 rounded shadow-xl border"
            style={{
              top: data.tooltipPos.y,
              left: data.tooltipPos.x,
            }}
          >
            <div className="font-semibold mb-1">{data.course_name}</div>
            <div>學分：{data.credits}</div>
            <div>年級：{data.year_level || "未指定"}</div>
            <div>學期：{data.semester || "未指定"}</div>

            <div className="mt-2 font-semibold">分類</div>
            <div className="flex flex-wrap gap-1 mt-1">
              {(data.categories || []).map((cat, idx) => (
                <span
                  key={idx}
                  className="px-2 py-1 text-xs rounded text-white"
                  style={{ background: categoryColor(cat) }}
                >
                  {cat}
                </span>
              ))}
            </div>
          </div>,
          tooltipRoot
        )}
    </>
  );
}
