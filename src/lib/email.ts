import nodemailer from 'nodemailer';
import path from 'path';
import fs from 'fs';

export async function sendEmail({ to, subject, html, text }: { to: string; subject: string; html: string; text?: string }) {
  console.log(`[EMAIL SENDING] To: ${to} | Subject: ${subject}`);
  
  // If credentials are left as test/default or empty, print to console instead of throwing errors
  const isDefaultSMTP = 
    !process.env.SMTP_USER || 
    process.env.SMTP_USER === 'test@example.com' || 
    !process.env.SMTP_PASS || 
    process.env.SMTP_PASS === 'testpass';

  if (isDefaultSMTP) {
    console.log(`[EMAIL CONTENT]\nSubject: ${subject}\nTo: ${to}\nContent:\n${text || html}\n-------------------`);
    return { mock: true, messageId: 'mock-id-' + Date.now() };
  }

  try {
    const transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST || 'smtp.gmail.com',
      port: parseInt(process.env.SMTP_PORT || '587'),
      secure: process.env.SMTP_PORT === '465', // true for 465, false for other ports
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS,
      },
    });

    const attachments: any[] = [];
    if (html && html.includes('cid:uklogo')) {
      const logoPath = path.join(process.cwd(), 'public', 'uklogo.png');
      if (fs.existsSync(logoPath)) {
        attachments.push({
          filename: 'uklogo.png',
          path: logoPath,
          cid: 'uklogo'
        });
      }
    }

    const info = await transporter.sendMail({
      from: process.env.SMTP_FROM || '"UK-Chammery Meals" <newchammery@gmail.com>',
      to,
      subject,
      text: text || html.replace(/<[^>]*>/g, ''), // Strip tags for plain text fallback
      html,
      attachments,
    });

    console.log(`[EMAIL SUCCESS] Message sent: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('[EMAIL ERROR] Failed to send email via SMTP:', error);
    // Keep system working by continuing
    return { error: true, details: error };
  }
}

