const puppeteer = require('puppeteer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const config = require('./config');

/**
 * 画像URLからファイルをダウンロードして指定パスに保存する
 * CDNのホットリンク保護を回避するため、記事URLをRefererとして送信する
 * @returns {string|null} 保存したファイルの拡張子 (例: '.jpg'), 失敗時 null
 */
async function downloadImageToFile(imageUrl, articleUrl, destPath) {
    if (!imageUrl) return null;
    const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36';
    try {
        const res = await fetch(imageUrl, {
            headers: {
                'User-Agent': UA,
                'Referer': articleUrl || imageUrl,
                'Accept': 'image/avif,image/webp,image/apng,image/svg+xml,image/*,*/*;q=0.8'
            },
            signal: AbortSignal.timeout(15000)
        });
        if (!res.ok) {
            console.log(`[Image DL] Failed (${res.status}): ${imageUrl.substring(0, 60)}`);
            return null;
        }
        const contentType = res.headers.get('content-type') || '';
        if (!contentType.startsWith('image/')) {
            console.log(`[Image DL] Non-image content-type (${contentType}): ${imageUrl.substring(0, 60)}`);
            return null;
        }
        const buffer = await res.arrayBuffer();
        fs.writeFileSync(destPath, Buffer.from(buffer));
        const size = Math.round(buffer.byteLength / 1024);
        console.log(`[Image DL] Saved ${size}KB -> ${path.basename(destPath)}`);
        return destPath;
    } catch (e) {
        console.log(`[Image DL] Error: ${e.message}`);
        return null;
    }
}


async function main() {
    const dataDir = path.join(__dirname, '..', 'data');
    const insightsFile = path.join(dataDir, 'insights.json');
    const templateFile = path.join(__dirname, 'templates', 'slide.ejs');
    const indexTemplateFile = path.join(__dirname, 'templates', 'index.ejs');
    const distDir = path.join(__dirname, '..', 'dist');
    const htmlOutDir = path.join(distDir, 'html');
    const imageOutDir = path.join(distDir, 'images');

    if (!fs.existsSync(insightsFile)) {
        console.error('Error: insights.json not found. Run generateInsights.js first.');
        process.exit(1);
    }

    const insightsData = JSON.parse(fs.readFileSync(insightsFile, 'utf-8'));

    if (!fs.existsSync(htmlOutDir)) fs.mkdirSync(htmlOutDir, { recursive: true });
    if (!fs.existsSync(imageOutDir)) fs.mkdirSync(imageOutDir, { recursive: true });

    const templateString = fs.readFileSync(templateFile, 'utf-8');

    console.log('Generating HTML slides...');
    const filesToCapture = [];
    const slidesForIndex = [];

    for (const [category, insight] of Object.entries(insightsData)) {
        if (!insight) continue;

        const safeName = category.replace(/[^a-z0-9]/gi, '_').toLowerCase();
        const htmlFile = path.join(htmlOutDir, `${safeName}.html`);
        const pngFileName = `${safeName}.png`;
        const jpgFileName = `${safeName}.jpg`;
        const pngFileFull = path.join(imageOutDir, pngFileName);
        const jpgFileFull = path.join(imageOutDir, jpgFileName);

        // 画像選択ロジック:
        // 1. originalImageUrl を Referer 付きでダウンロードして一時ファイルに保存 (CDNホットリンク対策)
        // 2. ダウンロード失敗 → 外部 URL をそのまま使用
        // 3. 画像なし → デフォルトアイコン
        let imageUrl = null;
        let isDefaultImage = false;

        if (insight.originalImageUrl) {
            const cachedImagePath = path.join(htmlOutDir, `${safeName}_image`);
            const saved = await downloadImageToFile(
                insight.originalImageUrl,
                insight.originalImageArticleUrl || insight.sourceUrl,
                cachedImagePath
            );
            if (saved) {
                // file:// パスでローカルファイルを参照 (外部リクエスト不要)
                imageUrl = `file://${cachedImagePath}`;
                console.log(`[INFO] Category: "${category}" -> Cached image: ${safeName}_image`);
            } else {
                // ダウンロード失敗なら外部 URL をフォールバック
                imageUrl = insight.originalImageUrl;
                console.log(`[INFO] Category: "${category}" -> Using remote URL: ${insight.originalImageUrl.substring(0, 60)}`);
            }
        }

        if (!imageUrl) {
            const defaultIconPath = path.resolve(__dirname, 'assets', 'default_news.png');
            imageUrl = `file://${defaultIconPath}`;
            isDefaultImage = true;
            console.log(`[INFO] Category: "${category}" -> No original image. Using local default icon.`);
        }

        const htmlContent = ejs.render(templateString, {
            category: category,
            insight: insight,
            imageUrl: imageUrl,
            isDefaultImage: isDefaultImage
        });

        fs.writeFileSync(htmlFile, htmlContent, 'utf-8');
        filesToCapture.push({ category, htmlFile, pngFile: pngFileFull, jpgFile: jpgFileFull });

        slidesForIndex.push({
            category: category,
            title: insight.title,
            summary: insight.summary,
            sourceName: insight.sourceName,
            sourceUrl: insight.sourceUrl,
            imageFile: pngFileName
        });
    }

    console.log('\nLaunching Puppeteer to capture slides...');
    const browser = await puppeteer.launch({
        headless: "new",
        args: ['--no-sandbox', '--disable-setuid-sandbox', '--allow-file-access-from-files']
    });

    // スライドごとにページを生成・破棄する（1失敗で全体が止まるのを防ぐ）
    for (const item of filesToCapture) {
        let page = null;
        try {
            page = await browser.newPage();
            // ニュースサイトの画像ブロック対策: リアルなUser-Agentを設定
            await page.setUserAgent('Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
            console.log(`Capturing: ${item.category}`);
            await page.goto(`file://${item.htmlFile}`, { waitUntil: 'networkidle2', timeout: 30000 });

            // 画像の読み込みを待機してからスクリーンショット
            await page.evaluate(async () => {
                const images = Array.from(document.querySelectorAll('img'));
                await Promise.all(images.map(img => {
                    if (img.complete) return;
                    return new Promise((resolve) => {
                        img.onload = resolve;
                        img.onerror = resolve; // エラーでもブロックしない
                        setTimeout(resolve, 10000);
                    });
                }));
            });

            // 1. Web PNG (High Res)
            await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 2 });
            await page.screenshot({ path: item.pngFile, type: 'png' });

            // 2. Email JPG (Standard Res)
            await page.setViewport({ width: 1920, height: 1080, deviceScaleFactor: 1 });
            await page.screenshot({ path: item.jpgFile, type: 'jpeg', quality: 60 });

            console.log(`Saved: ${item.category} (PNG & JPG)`);
        } catch (err) {
            // 1件失敗しても次のスライドへ継続する
            console.error(`[ERROR] Failed to capture slide for "${item.category}": ${err.message}`);
        } finally {
            if (page) {
                try { await page.close(); } catch (_) {}
            }
        }
    }

    await browser.close();

    console.log('\nGenerating index.html gallery...');
    const indexTemplateString = fs.readFileSync(indexTemplateFile, 'utf-8');
    const indexContent = ejs.render(indexTemplateString, { slides: slidesForIndex });
    fs.writeFileSync(path.join(distDir, 'index.html'), indexContent, 'utf-8');

    console.log('Process completed.');
    process.exit(0);
}

main().catch(error => {
    console.error(error);
    process.exit(1);
});
