// server/controllers/planController.js
import pool from "../config/db.js";

// ==========================================
// 取得個人課程規劃 (Get My Plan)
// ==========================================
export async function getMyPlan(req, res) {
  // 從 authenticateToken middleware 取得當前登入學生的 ID
  const userId = req.user.id;

  try {
    // 使用 JOIN 連接 courses 表，取得課程詳細資訊
    const query = `
      SELECT 
        p.plan_id, 
        p.academic_year, 
        p.semester, 
        p.created_at,
        c.course_id,
        c.course_name, 
        c.credits, 
        c.type,
        c.year_level AS recommended_year
      FROM student_course_plans p
      JOIN courses c ON p.course_id = c.course_id
      WHERE p.user_id = $1
      ORDER BY p.academic_year ASC, p.semester ASC, c.course_name ASC;
    `;
    
    const result = await pool.query(query, [userId]);
    
    // 回傳規劃列表 (陣列)
    res.json(result.rows);

  } catch (err) {
    console.error("取得課程規劃失敗:", err);
    res.status(500).json({ message: "伺服器錯誤，無法載入規劃。" });
  }
}

// ==========================================
// 加入課程到規劃 (Add to Plan)
// ==========================================
export async function addToPlan(req, res) {
  const userId = req.user.id;
  // 前端需要傳送這三個資料
  const { course_id, academic_year, semester } = req.body;

  // 基本驗證
  if (!course_id || !academic_year || !semester) {
    return res.status(400).json({ message: "資料不完整 (缺少課程、學年或學期)。" });
  }

  try {
    const query = `
      INSERT INTO student_course_plans (user_id, course_id, academic_year, semester)
      VALUES ($1, $2, $3, $4)
      RETURNING plan_id, academic_year, semester;
    `;
    
    const result = await pool.query(query, [userId, course_id, academic_year, semester]);
    
    res.status(201).json({ 
        message: "成功加入規劃！", 
        plan: result.rows[0] 
    });

  } catch (err) {
    console.error("加入規劃失敗:", err);
    
    // 💡 關鍵錯誤捕捉：檢查是否違反唯一性約束 (重複加入)
    // 錯誤碼 '23505' 代表 unique_violation
    if (err.code === '23505') {
        return res.status(409).json({ message: "您已在該學期規劃過此課程，請勿重複加入。" });
    }

    res.status(500).json({ message: "伺服器錯誤，加入失敗。" });
  }
}

// ==========================================
// 3. 移除規劃中的課程 (Remove from Plan)
// ==========================================
export async function removeFromPlan(req, res) {
  const userId = req.user.id;
  // 從網址參數取得要刪除的規劃 ID (例如 /api/plans/123 中的 123)
  const planId = req.params.planId;

  try {
    // 💡 安全性關鍵：刪除時必須同時檢查 plan_id 和 user_id
    // 確保學生只能刪除「屬於自己的」規劃紀錄
    const query = `
      DELETE FROM student_course_plans 
      WHERE plan_id = $1 AND user_id = $2
      RETURNING plan_id;
    `;
    
    const result = await pool.query(query, [planId, userId]);

    if (result.rowCount === 0) {
        // 如果找不到紀錄，可能是 planId 錯了，或者該紀錄不屬於這個使用者
        return res.status(404).json({ message: "找不到該規劃紀錄，或無權刪除。" });
    }
    
    res.json({ message: "已從規劃中移除。" });

  } catch (err) {
    console.error("移除規劃失敗:", err);
    res.status(500).json({ message: "伺服器錯誤，移除失敗。" });
  }
}

//  --- 導入模組
export const importModuleToPlan = async (req, res) => {
    const { userId, moduleId } = req.body;

    if (!userId || !moduleId) {
        return res.status(400).json({ error: "缺少 userId 或 moduleId" });
    }

    try {
        // 1. 取得使用者資訊 (取得入學年度)
        const userResult = await pool.query("SELECT enrollment_year FROM users WHERE user_id = $1", [userId]);
        if (userResult.rows.length === 0) {
            return res.status(404).json({ error: "找不到此使用者" });
        }
        const enrollmentYear = userResult.rows[0].enrollment_year;

        // 2. 抓出該模組的所有課程
        const moduleCoursesResult = await pool.query(`
            SELECT c.course_id, c.course_name, c.year_level, c.semester 
            FROM module_courses mc 
            JOIN courses c ON mc.course_id = c.course_id 
            WHERE mc.module_id = $1
        `, [moduleId]);

        const moduleCourses = moduleCoursesResult.rows;
        if (moduleCourses.length === 0) {
            return res.status(404).json({ error: "此模組內沒有設定任何課程" });
        }

        // 3. 抓出學生「已修過」或「已規劃」的課程 ID (避免重複)
        const recordsResult = await pool.query("SELECT course_id FROM student_course_records WHERE user_id = $1", [userId]);
        const plansResult = await pool.query("SELECT course_id FROM course_plans WHERE user_id = $1", [userId]);

        const existingCourseIds = new Set([
            ...recordsResult.rows.map(r => r.course_id),
            ...plansResult.rows.map(r => r.course_id)
        ]);

        // 4. 準備要寫入的資料 (Smart Scheduling)
        const plansToInsert = [];

        moduleCourses.forEach(course => {
            if (!existingCourseIds.has(course.course_id)) {
                // 自動推算邏輯：目標學年 = 入學年 + (課程年級 - 1)
                const yearOffset = (course.year_level || 1) - 1; 
                const targetYear = enrollmentYear + yearOffset;
                
                plansToInsert.push({
                    user_id: userId,
                    course_id: course.course_id,
                    academic_year: targetYear,
                    semester: course.semester
                });
            }
        });

        // 5. 執行寫入
        if (plansToInsert.length > 0) {
            const insertPromises = plansToInsert.map(plan => {
                return pool.query(
                    "INSERT INTO course_plans (user_id, course_id, academic_year, semester) VALUES ($1, $2, $3, $4)",
                    [plan.user_id, plan.course_id, plan.academic_year, plan.semester]
                );
            });

            await Promise.all(insertPromises);

            return res.status(200).json({ 
                success: true, 
                message: `成功匯入 ${plansToInsert.length} 門課程！`, 
                addedCount: plansToInsert.length 
            });
        } else {
            return res.status(200).json({ 
                success: true, 
                message: "您已擁有此模組的所有課程，無需新增。", 
                addedCount: 0 
            });
        }

    } catch (err) {
        console.error("匯入模組失敗:", err);
        res.status(500).json({ error: "伺服器錯誤" });
    }
};

export const getModules = async (req, res) => {
    try {
        // 使用 JSON 聚合查詢，一次把模組跟裡面的課程都抓出來
        const query = `
            SELECT m.*, 
            COALESCE(
                json_agg(
                    json_build_object(
                        'course_id', c.course_id, 
                        'course_name', c.course_name, 
                        'year_level', c.year_level, 
                        'semester', c.semester,
                        'credits', c.credits
                    ) ORDER BY c.year_level, c.semester
                ) FILTER (WHERE c.course_id IS NOT NULL), 
                '[]'
            ) as courses
            FROM modules m
            LEFT JOIN module_courses mc ON m.module_id = mc.module_id
            LEFT JOIN courses c ON mc.course_id = c.course_id
            GROUP BY m.module_id
            ORDER BY m.module_id;
        `;
        const result = await pool.query(query);
        res.status(200).json(result.rows);
    } catch (err) {
        console.error(err);
        res.status(500).json({ error: 'Server error' });
    }
};