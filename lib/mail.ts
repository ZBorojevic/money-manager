import nodemailer from "nodemailer";

const transporter = nodemailer.createTransport({
  host: process.env.SMTP_HOST,
  port: Number(process.env.SMTP_PORT ?? 465),
  secure: String(process.env.SMTP_SECURE ?? "true") === "true",
  auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
});

const MAIL_FROM = process.env.MAIL_FROM ?? "Money Manager <no-reply@example.com>";
const APP_URL = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

export async function sendVerificationEmail(to: string, token: string) {
  const url = `${APP_URL}/verify-email?token=${token}`;
  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: "Verify your email",
    html: `
      <p>Thanks for signing up! Please verify your email address:</p>
      <p><a href="${url}">${url}</a></p>
      <p>This link expires in 24 hours.</p>
    `,
  });
}

export async function sendPasswordResetEmail(to: string, token: string) {
  const url = `${APP_URL}/reset-password?token=${token}`;
  await transporter.sendMail({
    from: MAIL_FROM,
    to,
    subject: "Reset your password",
    html: `
      <p>We received a request to reset your password. You can set a new one here:</p>
      <p><a href="${url}">${url}</a></p>
      <p>This link expires in 1 hour. If you didn’t request this, you can ignore this email.</p>
    `,
  });
}
