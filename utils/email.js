// server/utils/email.js
import nodemailer from 'nodemailer';
import dotenv from 'dotenv';
dotenv.config();

const sendEmail = async (options) => {
  // 1. 建立 Transporter
  const transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: process.env.SMTP_PORT,
    //secure: process.env.SMTP_PORT == 465, 
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  // 2. 定義信件內容
  const mailOptions = {
    from: `學程地圖系統 <${process.env.SMTP_FROM_EMAIL}>`,
    to: options.to,
    subject: options.subject,
    html: options.html,
    // text: options.message // 如果不想用 HTML 格式可用純文字
  };

  // 3. 發送
  await transporter.sendMail(mailOptions);
};

export default sendEmail;