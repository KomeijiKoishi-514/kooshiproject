// middleware/authMiddleware.js
import jwt from "jsonwebtoken";
import dotenv from "dotenv";
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET || "change_this_secret";

/**
 * ==================================================
 * Middleware 1: 身分驗證守門員 (authenticateToken)
 * 用途：只負責檢查 Token 是否存在且有效。
 * 適用對象：所有需要登入的路由 (學生 + 管理員)。
 * ==================================================
 */
export function authenticateToken(req, res, next) {
  // 1. 從 Header 取得 Token
  const header = req.headers.authorization;

  if (!header || !header.startsWith("Bearer ")) {
    // 401 Unauthorized: 你沒帶證件，我不知道你是誰
    return res.status(401).json({ message: "拒絕訪問，缺少授權 Token" });
  }

  const token = header.split(" ")[1];

  try {
    // 2. 驗證 Token
    const decoded = jwt.verify(token, JWT_SECRET);

    // 3. 【關鍵】將解碼後的使用者資訊 (包含 user_id, role 等) 掛載到 req.user
    // 這樣後續的 Middleware 或 Controller 就可以使用 req.user 知道是誰來了
    req.user = decoded;

    // 4. 通過驗證，進入下一關
    next();
  } catch (err) {
    // 403 Forbidden: 你的證件是偽造的或過期了
    console.error("Token驗證失敗:", err.message);
    return res.status(403).json({ message: "Token 無效或已過期", error: err.message });
  }
}

/**
 * ==================================================
 * Middleware 2: 管理員權限檢查 (requireAdmin)
 * 用途：檢查已經通過驗證的使用者，其角色是否為 admin。
 * 適用對象：只有管理員能進入的路由。
 * 注意：必須放在 authenticateToken 之後使用。
 * ==================================================
 */
export function requireAdmin(req, res, next) {
  // 確保前面的 Middleware 已經執行過，且 req.user 存在
  // 這是為了防止開發者忘記放 authenticateToken 就直接用這個
  if (!req.user) {
     return res.status(500).json({ message: "伺服器設定錯誤：缺少身分驗證前置作業" });
  }

  // 檢查 Token 裡面的 role 欄位是否為 'admin'
  if (req.user.role !== 'admin') {
    // 403 Forbidden: 我知道你是誰 (例如學生)，但你的權限不夠
    return res.status(403).json({ message: "權限不足，僅限管理員訪問" });
  }

  // 是管理員，放行
  next();
}