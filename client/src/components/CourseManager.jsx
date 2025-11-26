import React, { useState, useEffect } from 'react';
import axios from 'axios';

function CourseManager() {
  const [courses, setCourses] = useState([]);
  const [newCourse, setNewCourse] = useState({
    course_name: '',
    dept_id: '',
    credits: '',
    semester: ''
  });

  // 取得課程列表
  useEffect(() => {
    fetchCourses();
  }, []);

  const fetchCourses = async () => {
    try {
      const res = await axios.get('http://localhost:8080/api/courses');
      setCourses(res.data);
    } catch (err) {
      console.error('❌ 無法取得課程資料:', err);
    }
  };

  // 新增課程
  const addCourse = async () => {
    try {
      await axios.post('http://localhost:8080/api/courses', newCourse);
      setNewCourse({ course_name: '', dept_id: '', credits: '', semester: '' });
      fetchCourses();
    } catch (err) {
      console.error('❌ 新增課程失敗:', err);
    }
  };

  // 刪除課程
  const deleteCourse = async (id) => {
    try {
      await axios.delete(`http://localhost:8080/api/courses/${id}`);
      fetchCourses();
    } catch (err) {
      console.error('❌ 刪除課程失敗:', err);
    }
  };

  return (
    <div className="bg-white shadow-md rounded-lg p-6 w-full max-w-3xl">
      <h2 className="text-2xl font-semibold mb-4 text-gray-700">課程清單</h2>

      <table className="w-full mb-6 border">
        <thead>
          <tr className="bg-indigo-100">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">課程名稱</th>
            <th className="p-2 border">學分</th>
            <th className="p-2 border">學期</th>
            <th className="p-2 border">操作</th>
          </tr>
        </thead>
        <tbody>
          {courses.map((course) => (
            <tr key={course.course_id}>
              <td className="border p-2">{course.course_id}</td>
              <td className="border p-2">{course.course_name}</td>
              <td className="border p-2">{course.credits}</td>
              <td className="border p-2">{course.semester}</td>
              <td className="border p-2">
                <button
                  onClick={() => deleteCourse(course.course_id)}
                  className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded"
                >
                  刪除
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <h2 className="text-lg font-semibold mb-2 text-gray-700">新增課程</h2>
      <div className="flex flex-wrap gap-2">
        <input
          type="text"
          placeholder="課程名稱"
          value={newCourse.course_name}
          onChange={(e) => setNewCourse({ ...newCourse, course_name: e.target.value })}
          className="border p-2 rounded flex-1"
        />
        <input
          type="number"
          placeholder="學分"
          value={newCourse.credits}
          onChange={(e) => setNewCourse({ ...newCourse, credits: e.target.value })}
          className="border p-2 rounded w-24"
        />
        <input
          type="text"
          placeholder="學期"
          value={newCourse.semester}
          onChange={(e) => setNewCourse({ ...newCourse, semester: e.target.value })}
          className="border p-2 rounded w-32"
        />
        <button
          onClick={addCourse}
          className="bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded"
        >
          新增
        </button>
      </div>
    </div>
  );
}

export default CourseManager;
