import { Router } from "express";
import { getMyRecords, toggleRecord } from "../controllers/recordController.js";
import { authenticateToken } from "../middleware/authMiddleware.js";

const router = Router();
router.use(authenticateToken);

router.get("/", getMyRecords);
router.post("/", toggleRecord);

export default router;