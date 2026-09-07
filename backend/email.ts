import nodemailer from 'nodemailer';

const createTransporter = async () => {
  // Use real SMTP if configured
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    return nodemailer.createTransport({
      host: process.env.SMTP_HOST,
      port: Number(process.env.SMTP_PORT) || 587,
      secure: process.env.SMTP_SECURE === 'true' || Number(process.env.SMTP_PORT) === 465, // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });
  }

  // Fallback: If no SMTP is configured in .env, just log to console (useful for dev)
  console.warn('⚠️ SMTP credentials not found in .env. Falling back to console-only mode.');
  return null;
};

export const sendOtpEmail = async (to: string, otpCode: string, name: string) => {
  const htmlContent = `
    <div style="font-family: sans-serif; max-w: 600px; margin: 0 auto; border: 1px solid #e5e7eb; border-radius: 12px; overflow: hidden;">
      <div style="background-color: #0f172a; padding: 24px; text-align: center;">
        <h1 style="color: white; margin: 0; font-size: 24px;">BPR ARA</h1>
      </div>
      <div style="padding: 32px 24px;">
        <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">Halo <strong>${name}</strong>,</p>
        <p style="font-size: 16px; color: #374151; margin-bottom: 24px;">
          Terima kasih telah mendaftar di Digital Ecosystem BPR ARA. Untuk melanjutkan pendaftaran, masukkan kode OTP 6 digit berikut di aplikasi:
        </p>
        <div style="background-color: #f3f4f6; border-radius: 8px; padding: 16px; text-align: center; margin-bottom: 24px;">
          <h2 style="margin: 0; font-size: 32px; letter-spacing: 4px; color: #111827;">${otpCode}</h2>
        </div>
        <p style="font-size: 14px; color: #6b7280; margin-bottom: 0;">
          Kode ini akan kedaluwarsa dalam waktu 10 menit. Jangan berikan kode ini kepada siapapun termasuk pihak BPR ARA.
        </p>
      </div>
    </div>
  `;

  const transporter = await createTransporter();

  if (transporter) {
    try {
      const info = await transporter.sendMail({
        from: `"BPR ARA Digital" <${process.env.SMTP_USER}>`,
        to,
        subject: 'Kode Verifikasi Pendaftaran BPR ARA',
        html: htmlContent,
      });
      console.log('Email sent: %s', info.messageId);
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      return false;
    }
  } else {
    console.log(`\n==========================================`);
    console.log(`📧 [MOCK EMAIL SENT TO ${to}]`);
    console.log(`🔑 OTP CODE: ${otpCode}`);
    console.log(`==========================================\n`);
    return true; // Simulate success
  }
};
