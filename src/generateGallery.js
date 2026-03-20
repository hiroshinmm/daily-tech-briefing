const puppeteer = require('puppeteer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const config = require('./config');

const USER_AGENTS = [
    'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36'
];

function getRandomUA() {
    return USER_AGENTS[Math.floor(Math.random() * USER_AGENTS.length)];
}

/**
 * 画像URLからファイルをダウンロードして指定パスに保存する
 */
async function downloadImageToFile(imageUrl, articleUrl, destPath) {
    if (!imageUrl) return null;
    try {
        const res = await fetch(imageUrl, {
            headers: { 
                'User-Agent': getRandomUA(), 
                'Referer': articleUrl || imageUrl 
            },
            signal: AbortSignal.timeout(15000)
        });
        if (!res.ok) return null;
        const buffer = await res.arrayBuffer();
        fs.writeFileSync(destPath, Buffer.from(buffer));
        return destPath;
    } catch (e) {
        return null;
    }
}

/**
 * Puppeteerを使用して画像を読み込み、軽量なJPGとしてキャプチャし直す
 */
async function resizeImageWithPuppeteer(browser, inputPath, outputPath) {
    let page = null;
    try {
        page = await browser.newPage();
        const buffer = fs.readFileSync(inputPath);
        const base64 = buffer.toString('base64');
        const dataUri = `data:image/jpeg;base64,${base64}`;

        await page.setContent(`<html><body style="margin:0;padding:0;"><img src="${dataUri}" style="width:400px;display:block;"></body></html>`);
        
        const isLoaded = await page.evaluate(() => {
            const img = document.querySelector('img');
            return img && img.complete && img.naturalWidth > 0;
        });

        if (!isLoaded) return false;

        await page.setViewport({ width: 400, height: 1200 });
        const rect = await page.evaluate(() => {
            const img = document.querySelector('img');
            if (!img) return null;
            const { x, y, width, height } = img.getBoundingClientRect();
            return { x, y, width, height };
        });

        if (!rect || rect.height === 0) return false;

        await page.screenshot({
            path: outputPath,
            clip: { x: 0, y: 0, width: 400, height: Math.min(rect.height, 800) },
            type: 'jpeg',
            quality: 50
        });
        return true;
    } catch (e) {
        return false;
    } finally {
        if (page) await page.close();
    }
}

async function main() {
    const dataDir = path.join(__dirname, '..', 'data');
    const insightsFile = path.join(dataDir, 'insights.json');
    const indexTemplateFile = path.join(__dirname, 'templates', 'index.ejs');
    const distDir = path.join(__dirname, '..', 'dist');
    const imageOutDir = path.join(distDir, 'images');
    const tempDir = path.join(__dirname, '..', 'tmp_img');

    if (!fs.existsSync(insightsFile)) {
        console.error('Error: insights.json not found.');
        process.exit(1);
    }

    const insightsData = JSON.parse(fs.readFileSync(insightsFile, 'utf-8'));
    
    if (fs.existsSync(imageOutDir)) {
        fs.readdirSync(imageOutDir).forEach(file => {
            if (file.endsWith('.jpg') || file.endsWith('.png')) fs.unlinkSync(path.join(imageOutDir, file));
        });
    } else {
        fs.mkdirSync(imageOutDir, { recursive: true });
    }
    
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const browser = await puppeteer.launch({
        headless: "new",
        args: [
            '--no-sandbox',
            '--disable-setuid-sandbox',
            '--disable-blink-features=AutomationControlled',
            '--disable-dev-shm-usage',
            '--disable-gpu'
        ]
    });

    console.log('[Gallery] Optimizing images...');
    const galleryItems = [];
    const entries = Object.entries(insightsData);
    
    // 並列度: 2 (メモリ負荷を考慮)
    const CONCURRENCY = 2;
    for (let i = 0; i < entries.length; i += CONCURRENCY) {
        const chunk = entries.slice(i, i + CONCURRENCY);
        await Promise.all(chunk.map(async ([category, insight]) => {
            if (!insight) return;

            const safeName = category.replace(/[^a-z0-9]/gi, '_').toLowerCase();
            let imageFileName = null;

            if (insight.originalImageUrl) {
                const rawPath = path.join(tempDir, `${safeName}_raw`);
                const optimizedName = `${safeName}_image.jpg`;
                const optimizedPath = path.join(imageOutDir, optimizedName);

                const downloaded = await downloadImageToFile(
                    insight.originalImageUrl,
                    insight.originalImageArticleUrl || insight.sourceUrl,
                    rawPath
                );

                if (downloaded) {
                    const resized = await resizeImageWithPuppeteer(browser, path.resolve(rawPath), optimizedPath);
                    if (resized) imageFileName = optimizedName;
                }
            }

            galleryItems.push({
                category,
                ...insight,
                imageFile: imageFileName
            });
        }));
    }

    console.log('[Gallery] Generating index.html...');
    const indexTemplateString = fs.readFileSync(indexTemplateFile, 'utf-8');
    try {
        const indexContent = ejs.render(indexTemplateString, { slides: galleryItems });
        fs.writeFileSync(path.join(distDir, 'index.html'), indexContent, 'utf-8');
    } catch (renderError) {
        console.error('EJS/Write Error:', renderError);
        throw renderError;
    }

    try {
        await browser.close();
    } catch (_) {}

    console.log('[Gallery] Process completed successfully.');
    process.exit(0);
}

main().catch(error => {
    console.error('CRITICAL ERROR:', error.message || error);
    process.exit(1);
});
