// server/controllers/adminUserController.js
import pool from "../config/db.js";
import bcrypt from "bcrypt";

// ==========================================
// 1. 讀取：取得所有使用者列表 (Get All Users)
// ==========================================
export async function getAllUsers(req, res) {
  try {
    // 只撈取必要的欄位，絕對不要撈 password_hash
    // 使用 ORDER BY user_id ASC 讓列表穩定排序
    const result = await pool.query(
      `SELECT user_id, username, full_name, email, role, dept_id, created_at 
       FROM users 
       ORDER BY user_id ASC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error("取得使用者列表失敗:", err);
    res.status(500).json({ message: "伺服器錯誤" });
  }
}

// ==========================================
// 2. 新增：建立新使用者 (Create User)
// ==========================================
export async function createUser(req, res) {
  // 管理員可以直接指定角色和系所
  const { username, password, full_name, email, role, dept_id } = req.body;

  // 基本驗證
  if (!username || !password || !full_name || !email || !role) {
    return res.status(400).json({ message: "所有欄位 (除了系所) 皆為必填" });
  }

  try {
    // 檢查帳號或 Email 是否重複
    const userExist = await pool.query(
      "SELECT user_id FROM users WHERE username = $1 OR email = $2",
      [username, email]
    );
    if (userExist.rowCount > 0) {
      return res.status(409).json({ message: "帳號或 Email 已存在" });
    }

    // 密碼加密
    const hashedPassword = await bcrypt.hash(password, 10);

    // 寫入資料庫
    const result = await pool.query(
      `INSERT INTO users (username, password_hash, full_name, email, role, dept_id)
       VALUES ($1, $2, $3, $4, $5, $6)
       RETURNING user_id, username, full_name, role`,
      [username, hashedPassword, full_name, email, role, dept_id || null]
    );

    res.status(201).json({ message: "使用者建立成功", user: result.rows[0] });

  } catch (err) {
    console.error("建立使用者失敗:", err);
    res.status(500).json({ message: "伺服器錯誤" });
  }
}

// ==========================================
// 3. 更新：修改使用者資料 (Update User)
// ==========================================
export async function updateUser(req, res) {
  const targetUserId = req.params.id; // 要修改的目標 User ID
  const { username, full_name, email, role, dept_id, password } = req.body;

  try {
    // 檢查要修改的 username/email 是否跟「其他人」衝突
    const checkConflict = await pool.query(
      "SELECT user_id FROM users WHERE (username = $1 OR email = $2) AND user_id != $3",
      [username, email, targetUserId]
    );
    if (checkConflict.rowCount > 0) {
      return res.status(409).json({ message: "更新失敗：使用者名稱或 Email 已被使用" });
    }

    // 動態建構 SQL Update 語句
    let updateFields = [];
    let values = [];
    let paramIndex = 1;

    // 加入基本欄位
    updateFields.push(`username = $${paramIndex++}`); values.push(username);
    updateFields.push(`full_name = $${paramIndex++}`); values.push(full_name);
    updateFields.push(`email = $${paramIndex++}`); values.push(email);
    updateFields.push(`role = $${paramIndex++}`); values.push(role);
    updateFields.push(`dept_id = $${paramIndex++}`); values.push(dept_id || null);
    
    // 【重要】密碼特殊處理：只有當前端有傳送 password 欄位時，才更新密碼
    if (password && password.trim() !== "") {
        const hashedPassword = await bcrypt.hash(password, 10);
        updateFields.push(`password_hash = $${paramIndex++}`);
        values.push(hashedPassword);
    }

    values.push(targetUserId); // 最後一個參數是 WHERE 用的 ID

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE user_id = $${paramIndex}
      RETURNING user_id, username, full_name, role;
    `;

    const result = await pool.query(updateQuery, values);

    if (result.rowCount === 0) {
        return res.status(404).json({ message: "找不到該使用者" });
    }

    res.json({ message: "使用者資料更新成功", user: result.rows[0] });

  } catch (err) {
    console.error("更新使用者失敗:", err);
    res.status(500).json({ message: "伺服器錯誤" });
  }
}

// ==========================================
// 4. 刪除：刪除使用者 (Delete User)
// ==========================================
export async function deleteUser(req, res) {
  const targetUserId = req.params.id;
  const currentOperatorId = req.user.id; // 當前操作者的 ID

  // 【重要防呆】禁止刪除自己
  // 強制轉型為字串比較，避免型別問題
  if (String(targetUserId) === String(currentOperatorId)) {
      return res.status(400).json({ message: "操作失敗：您不能刪除自己的帳號。" });
  }

  try {
    const result = await pool.query("DELETE FROM users WHERE user_id = $1 RETURNING username", [targetUserId]);
    
    if (result.rowCount === 0) {
        return res.status(404).json({ message: "找不到欲刪除的使用者" });
    }

    res.json({ message: `使用者 ${result.rows[0].username} 已成功刪除。` });

  } catch (err) {
    console.error("刪除使用者失敗:", err);
    // 如果有外鍵約束 (例如該學生已經有選課紀錄)，這裡會報錯
    if (err.code === '23503') {
        return res.status(409).json({ message: "無法刪除：該使用者尚有相關聯的資料 (如選課紀錄)。" });
    }
    res.status(500).json({ message: "伺服器錯誤" });
  }
}