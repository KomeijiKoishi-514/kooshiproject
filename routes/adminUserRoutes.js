// server/routes/adminUserRoutes.js
import { Router } from "express";
import {
  getAllUsers,
  createUser,
  updateUser,
  deleteUser,
} from "../controllers/adminUserController.js";
// 引入雙重驗證 Middleware
import { authenticateToken, requireAdmin } from "../middleware/authMiddleware.js";

const router = Router();

// 1. 先驗證是否登入 (authenticateToken)
// 2. 再驗證是否為管理員 (requireAdmin)
router.use(authenticateToken, requireAdmin);

// 定義路由路徑
// GET /api/admin/users - 取得列表
router.get("/", getAllUsers);

// POST /api/admin/users - 新增使用者
router.post("/", createUser);

// PUT /api/admin/users/:id - 修改使用者 (需要帶 ID)
router.put("/:id", updateUser);

// DELETE /api/admin/users/:id - 刪除使用者 (需要帶 ID)
router.delete("/:id", deleteUser);

export default router;