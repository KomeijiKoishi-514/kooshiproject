// routes/courseRoutes.js
import { Router } from "express";
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
  getCategories
} from "../controllers/courseController.js";
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// ==========================================
// 公開路由 (所有人都能訪問)
// ==========================================
// 取得課程列表通常是公開的，讓學生或遊客查看
router.get("/", getCourses);

// ==========================================
// 管理員專屬路由 (需要權限)
// ==========================================
// 執行的順序是：
// 1. authenticateToken: 先確認請求是否有帶有效的 Token (確認你是登入的使用者)
// 2. requireAdmin: 再確認 Token 裡的角色是不是 'admin' (確認你有管理權限)
// 3. 如果都通過，才執行最後的 Controller 動作

// 新增課程
router.post("/", authenticateToken, requireAdmin, createCourse);
// 修改課程
router.put("/:id", authenticateToken, requireAdmin, updateCourse);
// 刪除課程
router.delete("/:id", authenticateToken, requireAdmin, deleteCourse);
router.get("/categories", getCategories);

export default router;