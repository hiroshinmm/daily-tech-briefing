const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
require('dotenv').config();

async function main() {
  const { GMAIL_USER, GMAIL_PASS, GMAIL_TO, GITHUB_PAGES_URL } = process.env;

  if (!GMAIL_USER || !GMAIL_PASS || !GMAIL_TO) {
    console.error('Error: Gmail credentials (GMAIL_USER, GMAIL_PASS, GMAIL_TO) are not fully set in .env');
    process.exit(1);
  }

  const dataDir = path.join(__dirname, '..', 'data');
  const insightsFile = path.join(dataDir, 'insights.json');
  const imagesDir = path.join(__dirname, '..', 'dist', 'images');

  let insightsData = {};
  if (fs.existsSync(insightsFile)) {
    insightsData = JSON.parse(fs.readFileSync(insightsFile, 'utf-8'));
  }

  // Prepare attachments
  const attachments = [];
  if (fs.existsSync(imagesDir)) {
    const imageFiles = fs.readdirSync(imagesDir).filter(file => /\.(jpg|jpeg|png|gif)$/i.test(file));
    for (const file of imageFiles) {
      attachments.push({
        filename: file,
        path: path.join(imagesDir, file),
        cid: path.parse(file).name // Use filename without extension as Content-ID
      });
    }
  }

  // Build Email Content
  const today = new Date().toLocaleDateString('ja-JP', { month: 'short', day: 'numeric' });
  let htmlContent = `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 800px; margin: 0 auto; padding: 10px;">
      <h2 style="color: #1A2980; border-bottom: 2px solid #26D0CE; padding-bottom: 10px; font-size: 20px;">
        🚀 Daily Tech Briefing - ${today}
      </h2>
      <p style="font-size: 14px; line-height: 1.6;">おはようございます。本日の最新技術トレンドスライドが生成されました。添付画像の各カテゴリ別スライドをご覧いただくか、以下のサマリーをご確認ください。</p>
      
      <h3 style="margin-top: 30px; font-size: 18px;">📌 ピックアップトピック概要</h3>
      <div style="display: flex; flex-direction: column; gap: 20px;">
  `;

  for (const [category, insight] of Object.entries(insightsData)) {
    if (!insight) continue;

    htmlContent += `
      <div style="border: 1px solid #eee; border-radius: 8px; padding: 15px; background: #fafafa;">
        <div style="margin-bottom: 8px;">
          <strong style="color: #4A90E2; font-size: 14px;">${category}</strong>
        </div>
        <div style="margin-bottom: 8px;">
          <strong style="font-size: 16px;">${insight.title}</strong>
        </div>
        <div style="font-size: 13px; color: #555; line-height: 1.5; margin-bottom: 10px;">
          ${insight.summary}
        </div>
        <div>
          <a href="${insight.sourceUrl}" style="font-size: 12px; color: #999; text-decoration: none; display: inline-block;">[Source: ${insight.sourceName}]</a>
        </div>
      </div>
    `;
  }

  htmlContent += `
      </div>
      
      <div style="margin-top: 40px; font-size: 12px; color: #999; text-align: center;">
        <p>このメールは Automated Daily Icebreaks システムによって自動送信されています。</p>
      </div>
    </div>
  `;

  // Setup Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS // Use App Password if 2FA is enabled
    }
  });

  const mailOptions = {
    from: `"Tech Briefing Bot" <${GMAIL_USER}>`,
    to: GMAIL_TO,
    subject: `【自動生成】Daily Tech Briefing スライド更新通知 (${today})`,
    html: htmlContent,
    attachments: attachments
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Email sent successfully: ${info.messageId}`);
    process.exit(0);
  } catch (error) {
    console.error('Error sending email:', error);
    process.exit(1);
  }
}

main().catch(error => {
  console.error(error);
  process.exit(1);
});
