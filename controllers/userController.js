// server/controllers/userController.js
import pool from "../config/db.js";
import bcrypt from "bcrypt";

// ==========================================
// 1. 取得個人資料 (Get Profile)
// ==========================================
export async function getProfile(req, res) {
  const userId = req.user.id; // 從 authenticateToken middleware 取得

  try {
    // 查詢使用者資料 (排除密碼等敏感訊息)
    const result = await pool.query(
      `SELECT user_id, username, full_name, email, role, dept_id, created_at 
       FROM users 
       WHERE user_id = $1`,
      [userId]
    );

    if (result.rowCount === 0) {
      return res.status(404).json({ message: "找不到使用者資料" });
    }

    res.json(result.rows[0]);
  } catch (err) {
    console.error("取得個人資料失敗:", err);
    res.status(500).json({ message: "伺服器錯誤" });
  }
}

// ==========================================
// 2. 更新一般資訊 (Update General Info)
// ==========================================
export async function updateProfile(req, res) {
  const userId = req.user.id;
  const userRole = req.user.role;
  const { username, full_name, email, dept_id } = req.body;

  // 基本驗證
  if (!username || !full_name || !email) {
    return res.status(400).json({ message: "使用者名稱、姓名與 Email 為必填欄位" });
  }

  try {
    // 【關鍵檢查】檢查新的 username 或 email 是否被「其他人」佔用了
    // 重點是 WHERE user_id != $3，排除掉自己
    const checkConflict = await pool.query(
      "SELECT user_id FROM users WHERE (username = $1 OR email = $2) AND user_id != $3",
      [username, email, userId]
    );

    if (checkConflict.rowCount > 0) {
      // 這裡可以做更細緻的判斷是哪個欄位重複，暫時先統稱
      return res.status(409).json({ message: "更新失敗：使用者名稱或 Email 已被其他帳號使用" });
    }

    // 準備更新的欄位與數值
    let updateFields = [];
    let values = [];
    let paramIndex = 1;

    // 動態建構 SQL Update 語句
    updateFields.push(`username = $${paramIndex++}`);
    values.push(username);

    //  禁止一般使用者改名
    if (userRole === 'admin') {
      updateFields.push(`full_name = $${paramIndex++}`);
      values.push(full_name);
    }

    updateFields.push(`email = $${paramIndex++}`);
    values.push(email);

    // 只有學生角色才能修改 dept_id
    if (userRole === 'student' && dept_id !== undefined) {
        updateFields.push(`dept_id = $${paramIndex++}`);
        // 如果傳來的是空字串或 'null'，轉為資料庫的 NULL
        values.push(dept_id === "" || dept_id === "null" ? null : dept_id);
    }

    // 加入 WHERE 條件的 user_id
    values.push(userId);

    const updateQuery = `
      UPDATE users 
      SET ${updateFields.join(", ")}
      WHERE user_id = $${paramIndex}
      RETURNING user_id, username, full_name, email, role, dept_id;
    `;

    const result = await pool.query(updateQuery, values);

    res.json({ 
        message: "個人資料更新成功", 
        user: result.rows[0] 
    });

  } catch (err) {
    console.error("更新個人資料失敗:", err);
    // 捕捉資料庫層級的唯一性約束錯誤
    if (err.code === '23505') {
        return res.status(409).json({ message: "更新失敗：資料重複 (Username 或 Email)" });
    }
    res.status(500).json({ message: "伺服器錯誤" });
  }
}

// ==========================================
// 3. 修改密碼 (Change Password)
// ==========================================
export async function changePassword(req, res) {
    const userId = req.user.id;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
        return res.status(400).json({ message: "請輸入目前密碼與新密碼" });
    }

    if (newPassword.length < 6) {
        return res.status(400).json({ message: "新密碼長度至少需 6 個字元" });
    }

    try {
        // 1. 先撈出使用者目前的密碼 hash
        const userResult = await pool.query("SELECT password_hash FROM users WHERE user_id = $1", [userId]);
        if (userResult.rowCount === 0) {
            return res.status(404).json({ message: "找不到使用者" });
        }
        const user = userResult.rows[0];

        // 2. 【關鍵安全步驟】驗證「目前密碼」是否正確
        const isMatch = await bcrypt.compare(currentPassword, user.password_hash);
        if (!isMatch) {
            return res.status(401).json({ message: "目前密碼輸入錯誤，無法修改" });
        }

        // 3. 將新密碼加密
        const saltRounds = 10;
        const newHashedPassword = await bcrypt.hash(newPassword, saltRounds);

        // 4. 更新資料庫
        await pool.query("UPDATE users SET password_hash = $1 WHERE user_id = $2", [newHashedPassword, userId]);

        res.json({ message: "密碼修改成功！下次登入請使用新密碼。" });

    } catch (err) {
        console.error("修改密碼失敗:", err);
        res.status(500).json({ message: "伺服器錯誤" });
    }
}