// controllers/authController.js
import pool from "../config/db.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

// 管理員註冊（開發用）
export async function adminRegister(req, res) {
  const { username, password, display_name } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "帳號與密碼為必填" });

  try {
    const hash = await bcrypt.hash(password, 10);
    const result = await pool.query(
      "INSERT INTO admins (username, password_hash, display_name) VALUES ($1, $2, $3) RETURNING id, username, display_name",
      [username, hash, display_name || username]
    );
    res.json({ admin: result.rows[0] });
  } catch (err) {
    console.error("註冊失敗:", err);
    res.status(500).json({ message: "伺服器錯誤" });
  }
}

// 管理員登入（會回傳 JWT）
export async function adminLogin(req, res) {
  const { username, password } = req.body;
  if (!username || !password)
    return res.status(400).json({ message: "帳號與密碼為必填" });

  try {
    const result = await pool.query(
      "SELECT id, username, password_hash FROM admins WHERE username=$1",
      [username]
    );
    if (result.rowCount === 0)
      return res.status(401).json({ message: "找不到該使用者" });

    const admin = result.rows[0];
    const ok = await bcrypt.compare(password, admin.password_hash);
    if (!ok) return res.status(401).json({ message: "密碼錯誤" });

    const token = jwt.sign(
      { id: admin.id, username: admin.username },
      JWT_SECRET,
      { expiresIn: "8h" }
    );

    res.json({ token, username: admin.username });
  } catch (err) {
    console.error("登入失敗:", err);
    res.status(500).json({ message: "伺服器錯誤" });
  }
}
