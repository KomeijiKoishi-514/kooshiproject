//  課程頁面(暫時沒用)

import React, { useEffect, useState } from "react";
import axios from "../api/axiosConfig";

const Courses = () => {
  const [courses, setCourses] = useState([]);

  useEffect(() => {
    axios.get("/courses")
      .then((res) => setCourses(res.data))
      .catch((err) => console.error("❌ 無法取得課程資料：", err));
  }, []);

  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">課程清單</h1>
      <table className="min-w-full border text-left border-gray-300">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">課程名稱</th>
            <th className="border px-4 py-2">授課教師</th>
            <th className="border px-4 py-2">星期</th>
            <th className="border px-4 py-2">時間</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((c) => (
            <tr key={c.course_id}>
              <td className="border px-4 py-2">{c.course_name}</td>
              <td className="border px-4 py-2">{c.teacher}</td>
              <td className="border px-4 py-2">星期{c.weekday}</td>
              <td className="border px-4 py-2">
                {c.start_time} ~ {c.end_time}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default Courses;
