//  Token驗證用
// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

export function verifyAdminToken(req, res, next) {
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    return res.status(401).json({ message: "缺少授權 Token" });
  }

  const token = header.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // 可加上身分驗證 (若你未來有 admin roles)
    req.admin = decoded;

    next();
  } catch (err) {
    return res.status(401).json({ message: "授權失敗", error: err.message });
  }
}
