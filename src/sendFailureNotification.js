const nodemailer = require('nodemailer');
require('dotenv').config();

async function main() {
    const { GMAIL_USER, GMAIL_PASS, GMAIL_TO, RUN_URL, FAILED_JOB } = process.env;

    if (!GMAIL_USER || !GMAIL_PASS || !GMAIL_TO) {
        console.error('Error: Gmail credentials not set. Cannot send failure notification.');
        process.exit(0); // 通知失敗で全体をエラー扱いにしない
    }

    const today = new Date().toLocaleDateString('ja-JP', {
        timeZone: 'Asia/Tokyo',
        year: 'numeric',
        month: '2-digit',
        day: '2-digit'
    });

    const runLink = RUN_URL ? `<a href="${RUN_URL}">Actions ログを確認する</a>` : '(URLなし)';
    const jobInfo = FAILED_JOB ? `<pre style="background:#f8f8f8;padding:10px;font-size:12px;">${FAILED_JOB}</pre>` : '';

    const html = `
<div style="font-family:Arial,sans-serif;color:#333;max-width:600px;margin:0 auto;padding:20px;">
  <h2 style="color:#dc2626;border-bottom:2px solid #dc2626;padding-bottom:10px;">
    ⚠️ Daily Tech Briefing - 実行失敗 (${today})
  </h2>
  <p>本日の Daily Tech Briefing GitHub Actions ワークフローが失敗しました。</p>
  <p style="margin:20px 0;">
    ${runLink}
  </p>
  ${jobInfo}
  <p style="font-size:12px;color:#94a3b8;margin-top:30px;">
    このメールは失敗時自動通知です。
  </p>
</div>`;

    const transporter = nodemailer.createTransport({
        service: 'gmail',
        auth: { user: GMAIL_USER, pass: GMAIL_PASS }
    });

    try {
        const info = await transporter.sendMail({
            from: `"Daily Tech Briefing Bot" <${GMAIL_USER}>`,
            to: GMAIL_TO,
            subject: `[失敗] Daily Tech Briefing ワークフローエラー (${today})`,
            html
        });
        console.log(`Failure notification sent: ${info.messageId}`);
    } catch (error) {
        console.error('Failed to send failure notification:', error.message);
    }
    process.exit(0);
}

main().catch(() => process.exit(0));
