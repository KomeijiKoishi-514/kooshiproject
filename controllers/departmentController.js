// controllers/departmentController.js
import pool from "../config/db.js";

export const getDepartments = async (req, res) => {
  try {
    // 撈取所有系所，並依照 ID 排序
    const result = await pool.query("SELECT dept_id, dept_name FROM departments ORDER BY dept_id ASC");
    res.json(result.rows);
  } catch (err) {
    console.error(err);
    res.status(500).send("Server Error");
  }
};