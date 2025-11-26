// controllers/categoryController.js
import pool from "../config/db.js";

export async function getCategories(req, res) {
  try {
    const result = await pool.query(`
      SELECT category_id, category_name
      FROM categories
      ORDER BY category_id;
    `);

    res.json(result.rows);
  } catch (err) {
    console.error("取得分類失敗:", err);
    res.status(500).json({ error: err.message });
  }
}
