// routes/curriculumRoutes.js
import express from "express";
import { getCurriculumByDept } from "../controllers/curriculumController.js";

const router = express.Router();

router.get("/:dept_id", getCurriculumByDept);

export default router;
