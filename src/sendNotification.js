const nodemailer = require('nodemailer');
const fs = require('fs');
const path = require('path');
const ejs = require('ejs');
require('dotenv').config();

async function main() {
  const { GMAIL_USER, GMAIL_PASS, GMAIL_TO, GITHUB_PAGES_URL } = process.env;

  if (!GMAIL_USER || !GMAIL_PASS || !GMAIL_TO) {
    console.error('Error: Gmail credentials (GMAIL_USER, GMAIL_PASS, GMAIL_TO) are not fully set in .env');
    process.exit(1);
  }

  const today = new Date().toLocaleDateString('ja-JP', {
    timeZone: 'Asia/Tokyo',
    month: 'short',
    day: 'numeric'
  });

  const dataDir = path.join(__dirname, '..', 'data');
  const insightsFile = path.join(dataDir, 'insights.json');
  const imagesDir = path.join(__dirname, '..', 'dist', 'images');

  let insightsData = {};
  if (fs.existsSync(insightsFile)) {
    insightsData = JSON.parse(fs.readFileSync(insightsFile, 'utf-8'));
  }

  // 添付ファイルの準備 (記事のオリジナル画像をインライン表示用に添付)
  const attachments = [];

  if (fs.existsSync(imagesDir)) {
    const imageFiles = fs.readdirSync(imagesDir).filter(file => /_image\.jpg$/i.test(file));
    for (const file of imageFiles) {
        const fullPath = path.join(imagesDir, file);
        const fileName = path.basename(file);
        const cid = fileName.replace(/\.[^/.]+$/, ""); // safeName_image
        attachments.push({
            filename: fileName,
            path: fullPath,
            cid: cid
        });
    }
  }

  // 各記事の要素を並べ替え
  const emailItems = [];
  let needsDefaultIcon = false;

  const entries = Object.entries(insightsData);
  for (const [category, insight] of entries) {
    if (!insight) continue;

    const safeName = category.replace(/[^a-z0-9]/gi, '_').toLowerCase();
    const cid = `${safeName}_image`;
    
    // この記事の個別画像が大元の添付ファイル候補(imageFiles)にあるかを確認
    const hasSpecificImage = attachments.some(a => a.cid === cid);
    
    let displayCid = null;
    let imgStyle = "";

    if (hasSpecificImage) {
      displayCid = cid;
      imgStyle = "width: 100%; max-width: 600px; height: auto; border-radius: 8px; border: 1px solid #f1f5f9; display: block; margin: 0 auto;";
    } else {
      displayCid = 'default_icon';
      imgStyle = "width: 100%; max-width: 150px; height: auto; border-radius: 8px; border: 1px solid #f1f5f9; display: block; margin: 0 auto; filter: grayscale(100%); opacity: 0.5;";
      needsDefaultIcon = true;
    }

    emailItems.push({
      category,
      ...insight,
      displayCid,
      imgStyle
    });
  }

  // デフォルトアイコンが必要な場合のみ、添付ファイルに加える
  if (needsDefaultIcon) {
    const assetsDir = path.join(__dirname, 'assets');
    const defaultIconPath = path.join(assetsDir, 'default_news.png');
    if (fs.existsSync(defaultIconPath)) {
      attachments.push({
        filename: 'default_news.png',
        path: defaultIconPath,
        cid: 'default_icon'
      });
    }
  }

  // EJS テンプレートから HTML を生成
  const emailTemplateFile = path.join(__dirname, 'templates', 'email.ejs');
  const emailTemplateString = fs.readFileSync(emailTemplateFile, 'utf-8');
  const htmlContent = ejs.render(emailTemplateString, {
    today,
    githubPagesUrl: GITHUB_PAGES_URL,
    items: emailItems
  });

  // Setup Nodemailer transporter
  const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: GMAIL_USER,
      pass: GMAIL_PASS
    }
  });

  const mailOptions = {
    from: `"Daily Tech Briefing Bot" <${GMAIL_USER}>`,
    to: GMAIL_TO,
    subject: `Daily Tech Briefing 更新通知 (${today})`,
    html: htmlContent,
    attachments: attachments // ここで、needsDefaultIcon によってフィルタリングされた attachments を使用
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
