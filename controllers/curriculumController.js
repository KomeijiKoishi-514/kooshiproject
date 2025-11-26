import pool from "../config/db.js";

export async function getCurriculumByDept(req, res) {
  try {
    const deptId = req.params.dept_id;
    /* 轉換對應編號到特定學年。 */
    function convertYearText(level) {
      const map = {
        1: "一年級上",
        2: "一年級下",
        3: "二年級上",
        4: "二年級下",
        5: "三年級上",
        6: "三年級下",
        7: "四年級上",
        8: "四年級下",
      };
      return map[level] || "未指定";
    }

    const courseQuery = `
      SELECT c.course_id, c.course_name, c.credits, c.year_level, c.semester
      FROM courses c 
      WHERE c.dept_id = $1 OR c.dept_id = 0
      ORDER BY c.year_level ASC;
    `;

    const prereqQuery = `
      SELECT course_id, prereq_id 
      FROM course_prerequisite;
    `;

    const categoriesQuery = `
      SELECT ccm.course_id, cat.category_name
      FROM course_category_map ccm
      JOIN categories cat ON ccm.category_id = cat.category_id;
    `;

    const [courses, prerequisites, categories] = await Promise.all([
      pool.query(courseQuery, [deptId]),
      pool.query(prereqQuery),
      pool.query(categoriesQuery),
    ]);

    // course_id → course info
    const courseMap = {};

    // 先加入基本資料
    courses.rows.forEach((c) => {
      courseMap[c.course_id] = {
        course_id: c.course_id,
        course_name: c.course_name,
        credits: c.credits,
        year_level: c.year_level,
        year_text: convertYearText(c.year_level), // 新增中文年級
        semester: c.semester,
        categories: [],
      };
    });

    // 加入分類
    categories.rows.forEach((cat) => {
      if (courseMap[cat.course_id]) {
        courseMap[cat.course_id].categories.push(cat.category_name);
      }
    });

    // 正確回傳方式（前端才能收到）
    res.json({
      courses: Object.values(courseMap),   // NOT courses.rows !!!
      prerequisites: prerequisites.rows,
    });

  } catch (err) {
    res.status(500).json({
      message: "伺服器錯誤",
      error: err.message,
    });
  }
}
