// server/controllers/recordController.js
import pool from "../config/db.js";

// 取得我的修課狀態 (回傳 Map 格式方便前端查找)
export async function getMyRecords(req, res) {
  const userId = req.user.id;
  try {
    const result = await pool.query(
      "SELECT course_id, status FROM student_course_records WHERE user_id = $1",
      [userId]
    );
    // 轉成物件格式: { 101: 'pass', 102: 'ing' }
    const recordMap = {};
    result.rows.forEach(r => {
      recordMap[r.course_id] = r.status;
    });
    res.json(recordMap);
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server Error" });
  }
}

// 切換修課狀態 (Upsert)
export async function toggleRecord(req, res) {
  const userId = req.user.id;
  const { course_id, status } = req.body; // status: 'ing', 'pass', or 'none'

  try {
    if (status === 'none') {
      // 如果切換回未修，就刪除紀錄
      await pool.query(
        "DELETE FROM student_course_records WHERE user_id = $1 AND course_id = $2",
        [userId, course_id]
      );
    } else {
      // 否則新增或更新 (PostgreSQL UPSERT 語法)
      await pool.query(
        `INSERT INTO student_course_records (user_id, course_id, status)
         VALUES ($1, $2, $3)
         ON CONFLICT (user_id, course_id) 
         DO UPDATE SET status = $3, updated_at = now()`,
        [userId, course_id, status]
      );
    }
    res.json({ success: true });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "更新失敗" });
  }
}