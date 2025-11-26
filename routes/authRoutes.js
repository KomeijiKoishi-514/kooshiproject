// routes/authRoutes.js
import express from "express";
import { adminLogin, adminRegister } from "../controllers/authController.js";

const router = express.Router();

router.post("/login", adminLogin);
router.post("/register", adminRegister);

export default router;
