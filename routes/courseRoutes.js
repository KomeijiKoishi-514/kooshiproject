// routes/courseRoutes.js
import { Router } from "express";
import {
  getCourses,
  createCourse,
  updateCourse,
  deleteCourse,
} from "../controllers/courseController.js";
import {verifyAdminToken} from "../middleware/authMiddleware.js";
const router = Router();
router.get("/", getCourses);
router.post("/", verifyAdminToken, createCourse);
router.put("/:id", verifyAdminToken, updateCourse);
router.delete("/:id", verifyAdminToken, deleteCourse);
export default router;
