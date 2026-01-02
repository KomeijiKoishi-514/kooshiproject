// server/routes/userRoutes.js
import { Router } from "express";
import {
  getProfile,
  updateProfile,
  changePassword,
} from "../controllers/userController.js";
import { authenticateToken } from "../middleware/authMiddleware.js"; // 引入身分驗證 Middleware

const router = Router();

// 🔒 所有路由都套用 authenticateToken 中間件
router.use(authenticateToken);

// 取得個人資料 (GET /api/user/profile)
router.get("/profile", getProfile);

// 更新一般資訊 (PUT /api/user/profile)
router.put("/profile", updateProfile);

// 修改密碼 (PUT /api/user/change-password)
router.put("/change-password", changePassword);

export default router;