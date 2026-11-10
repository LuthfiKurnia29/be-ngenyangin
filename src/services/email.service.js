import nodemailer from 'nodemailer';
import { config } from '../config/env.js';

let transporter = null;

const getTransporter = () => {
  if (transporter) return transporter;

  if (!config.smtp.user || !config.smtp.pass) {
    console.warn('⚠️  SMTP belum dikonfigurasi. Email tidak akan terkirim (token akan ditampilkan di console).');
    return null;
  }

  transporter = nodemailer.createTransport({
    host: config.smtp.host,
    port: config.smtp.port,
    secure: config.smtp.port === 465,
    auth: {
      user: config.smtp.user,
      pass: config.smtp.pass,
    },
  });

  return transporter;
};

export const emailService = {
  /**
   * Kirim email reset password
   */
  async sendResetPasswordEmail(toEmail, userName, resetToken) {
    const resetUrl = `${config.frontendUrl}/reset-password?token=${resetToken}&email=${encodeURIComponent(toEmail)}`;

    const htmlContent = `
      <div style="font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px;">
        <div style="background: linear-gradient(135deg, #22c55e, #16a34a); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">🍽️ Ngenyangin</h1>
          <p style="color: rgba(255,255,255,0.9); margin: 8px 0 0;">Reset Password</p>
        </div>
        <div style="background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-top: none; border-radius: 0 0 12px 12px;">
          <p style="color: #374151; font-size: 16px;">Halo <strong>${userName || 'Pengguna'}</strong>,</p>
          <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
            Kami menerima permintaan untuk mereset password akun Ngenyangin Anda.
            Klik tombol di bawah untuk membuat password baru:
          </p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${resetUrl}"
               style="background: #22c55e; color: white; padding: 14px 32px; border-radius: 8px;
                      text-decoration: none; font-weight: 600; font-size: 16px; display: inline-block;">
              Reset Password Saya
            </a>
          </div>
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6;">
            Atau salin kode OTP berikut dan masukkan di halaman reset password:
          </p>
          <div style="background: #f3f4f6; padding: 16px; border-radius: 8px; text-align: center; margin: 16px 0;">
            <code style="font-size: 28px; font-weight: 700; letter-spacing: 6px; color: #111827;">${resetToken}</code>
          </div>
          <p style="color: #9ca3af; font-size: 12px; margin-top: 24px; line-height: 1.5;">
            ⏰ Token ini hanya berlaku selama <strong>15 menit</strong>.<br>
            Jika Anda tidak merasa meminta reset password, abaikan email ini.
          </p>
        </div>
        <p style="text-align: center; color: #9ca3af; font-size: 11px; margin-top: 16px;">
          &copy; ${new Date().getFullYear()} Ngenyangin. All rights reserved.
        </p>
      </div>
    `;

    const mailTransporter = getTransporter();

    if (!mailTransporter) {
      // Fallback: tampilkan token di console jika SMTP belum dikonfigurasi
      console.log('═══════════════════════════════════════════');
      console.log(`📧 RESET PASSWORD TOKEN (SMTP tidak aktif)`);
      console.log(`   Email : ${toEmail}`);
      console.log(`   Token : ${resetToken}`);
      console.log(`   URL   : ${resetUrl}`);
      console.log('═══════════════════════════════════════════');
      return { success: true, fallback: true };
    }

    const mailOptions = {
      from: `"${config.smtp.fromName}" <${config.smtp.fromEmail}>`,
      to: toEmail,
      subject: 'Reset Password Akun Ngenyangin Anda',
      html: htmlContent,
    };

    const info = await mailTransporter.sendMail(mailOptions);
    return { success: true, messageId: info.messageId };
  },
};

