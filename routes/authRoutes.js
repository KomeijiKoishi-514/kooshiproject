// server/routes/authRoutes.js
import { Router } from "express";
import {
  login,
  forgotPassword,
  register, 
  resetPassword
  // adminRegister // 如果開發用的管理員註冊還要保留就留著
} from "../controllers/authController.js";

const router = Router();

// router.post("/admin/register", adminRegister); // 開發用路由

router.post("/login", login);
router.post("/forgot-password", forgotPassword);
router.post("/register", register);
router.post("/reset-password/:token", resetPassword);

export default router;