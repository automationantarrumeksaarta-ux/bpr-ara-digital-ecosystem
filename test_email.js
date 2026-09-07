import nodemailer from 'nodemailer';
import dotenv from 'dotenv';

dotenv.config();

console.log('Testing SMTP with:', {
  host: process.env.SMTP_HOST,
  port: process.env.SMTP_PORT,
  user: process.env.SMTP_USER,
  secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
});

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT) || 587,
  secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465,
  auth: {
    user: process.env.SMTP_USER,
    pass: process.env.SMTP_PASS,
  },
});

async function main() {
  try {
    const info = await transporter.sendMail({
      from: `"BPR ARA Test" <${process.env.SMTP_USER}>`,
      to: process.env.SMTP_USER, // Send to self
      subject: 'Test Email',
      text: 'This is a test email.',
    });
    console.log('Email sent: %s', info.messageId);
  } catch (error) {
    console.error('Error sending email:', error);
  }
}

main();
