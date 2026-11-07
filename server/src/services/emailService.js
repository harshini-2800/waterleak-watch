import nodemailer from 'nodemailer';
import { logger } from '../utils/logger.js';

let transporter = null;

// Initialize transporter
if (process.env.SMTP_HOST && process.env.SMTP_USER) {
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || '587', 10),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
}

export async function sendEmail({ to, subject, html, text }) {
  if (!to) return;

  const mailOptions = {
    from: process.env.EMAIL_FROM || '"WaterLeak Watch" <notifications@waterleakwatch.org>',
    to,
    subject,
    text: text || subject,
    html: html || `<p>${text || subject}</p>`
  };

  if (transporter) {
    try {
      const info = await transporter.sendMail(mailOptions);
      logger.info(`Email sent to ${to}: ${info.messageId}`);
      return info;
    } catch (err) {
      logger.error(`Failed to send email to ${to}:`, err.message);
    }
  } else {
    // Console fallback
    logger.info(`[Email Service Simulation] To: ${to} | Subject: "${subject}" | Content: ${text || subject}`);
  }
}

