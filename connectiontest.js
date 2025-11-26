//  測試資料庫連線
//   node connectiontest.js  

import pool from "./config/db.js";

const test = async () => {
  try {
    const res = await pool.query("SELECT NOW()");
    console.log("資料庫連線成功：", res.rows[0]);
  } catch (err) {
    console.error("資料庫連線失敗：", err);
  } finally {
    pool.end();
  }
};

test();
