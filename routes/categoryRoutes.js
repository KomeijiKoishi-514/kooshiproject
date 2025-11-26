import express from "express";
//import db from "../config/db.js";
import { getCategories } from "../controllers/categoryController.js";
const router = express.Router();

// 取得所有分類
router.get("/", getCategories);

export default router;
