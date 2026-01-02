// server.js
import express from "express";
import cors from "cors";
import bodyParser from "body-parser";
import dotenv from "dotenv";
import { neon } from "@neondatabase/serverless";

// 匯入路由
import adminUserRoutes from "./routes/adminUserRoutes.js"
import categoryRoutes from "./routes/categoryRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";
import curriculumRoutes from "./routes/curriculumRoutes.js";
import authRoutes from "./routes/authRoutes.js";
import departmentRoutes from "./routes/departmentRoutes.js";
import userRoutes from "./routes/userRoutes.js";
import planRoutes from "./routes/planRoutes.js";
import recordRoutes from "./routes/recordRoutes.js";

dotenv.config();

const app = express();
app.use(cors());
app.use(bodyParser.json());

const corsOptions = {
  origin: [
    "http://localhost:3000", // 允許本地開發
    "https://my-super-project-api.loca.lt"
  ],
  methods: "GET,HEAD,PUT,PATCH,POST,DELETE",
  credentials: true,
  optionsSuccessStatus: 204,
};

app.use(cors(corsOptions));

// ======================================
// Neon 資料庫初始化
// ======================================
const sql = neon(process.env.DATABASE_URL);
// 測試連線 API
app.get("/api/version", async (req, res) => {
  try {
    const result = await sql`SELECT version()`;
    res.json({ version: result[0].version });
  } catch (err) {
    console.error("資料庫連線錯誤:", err);
    res.status(500).json({ error: "無法連線資料庫" });
  }
});

// ======================================
//  API 路由掛載區
// ======================================
app.use("/api/auth", authRoutes);
app.use("/api/admin/users", adminUserRoutes);
app.use("/api/course-categories", categoryRoutes);
app.use("/api/courses", courseRoutes);
app.use("/api/curriculum", curriculumRoutes);
app.use("/api/departments", departmentRoutes);
app.use("/api/plans", planRoutes);
app.use("/api/user", userRoutes);
app.use("/api/records", recordRoutes);
// ======================================
//  啟動伺服器
// ======================================
const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server running on 0.0.0.0:${PORT}`);
});