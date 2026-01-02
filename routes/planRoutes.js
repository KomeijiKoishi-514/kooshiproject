// server/routes/planRoutes.js
import { Router } from "express";
import {
  getMyPlan,
  addToPlan,
  removeFromPlan,
  importModuleToPlan,
  getModules,
} from "../controllers/planController.js";
// 引入身分驗證 Middleware
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();

// 🔒 所有規劃相關路由都需要登入驗證
router.use(authenticateToken);

// GET /api/plans - 取得我的規劃列表
router.get("/", getMyPlan);

// POST /api/plans - 加入課程到規劃
router.post("/", addToPlan);

// DELETE /api/plans/:planId - 移除某筆規劃 (需要帶 planId)
router.delete("/:planId", removeFromPlan);

router.post('/import-module', importModuleToPlan);

router.get('/modules', getModules);

export default router;