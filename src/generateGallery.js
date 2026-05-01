const puppeteer = require('puppeteer');
const ejs = require('ejs');
const fs = require('fs');
const path = require('path');
const config = require('./config');
const { getRandomUA, PUPPETEER_ARGS } = require('./urlUtils');

/**
 * archiveDir 配下から cutoff より古いJSONファイルを再帰的に削除し、空ディレクトリも除去する。
 * 削除件数を返す。
 */
function pruneArchives(archiveDir, cutoff) {
    let deleted = 0;
    fs.readdirSync(archiveDir).forEach(entry => {
        const entryPath = path.join(archiveDir, entry);
        if (fs.statSync(entryPath).isDirectory()) {
            deleted += pruneArchives(entryPath, cutoff);
            if (fs.readdirSync(entryPath).length === 0) {
                fs.rmdirSync(entryPath);
            }
        } else if (entry.endsWith('.json')) {
            const rel = path.relative(archiveDir, entryPath).split(path.sep);
            // rel = [] when file is directly under archiveDir (YYYY/MM/DD.json structure)
            // entryPath = .../archives/2026/03/20.json → rel from parent = ['2026','03','20.json']
            // But here archiveDir is the root, so we need to parse from the path segments
            const parts = entryPath.replace(/\\/g, '/').split('/');
            const day = entry.replace('.json', '');
            const month = parts[parts.length - 2];
            const year = parts[parts.length - 3];
            const dateStr = `${year}-${month}-${day}`;
            if (!isNaN(Date.parse(dateStr)) && new Date(dateStr) < cutoff) {
                fs.unlinkSync(entryPath);
                deleted++;
            }
        }
    });
    return deleted;
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
 * magic bytes からファイルの MIME タイプを推定する
 */
function detectMimeType(buffer) {
    if (buffer.length >= 3 && buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF) return 'image/jpeg';
    if (buffer.length >= 4 && buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47) return 'image/png';
    if (buffer.length >= 6 && buffer[0] === 0x47 && buffer[1] === 0x49 && buffer[2] === 0x46) return 'image/gif';
    if (buffer.length >= 12 && buffer.slice(0, 4).toString('ascii') === 'RIFF' && buffer.slice(8, 12).toString('ascii') === 'WEBP') return 'image/webp';
    if (buffer.length >= 12) {
        const brand = buffer.slice(8, 12).toString('ascii');
        if (['avif', 'avis', 'avio'].includes(brand)) return 'image/avif';
        if (['heic', 'heis', 'heim', 'heix'].includes(brand)) return 'image/heic';
    }
    return 'image/jpeg';
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
        const mimeType = detectMimeType(buffer);
        const dataUri = `data:${mimeType};base64,${base64}`;

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

    if (!fs.existsSync(imageOutDir)) fs.mkdirSync(imageOutDir, { recursive: true });
    if (!fs.existsSync(tempDir)) fs.mkdirSync(tempDir, { recursive: true });

    const browser = await puppeteer.launch({
        headless: "new",
        args: PUPPETEER_ARGS
    });

    console.log('[Gallery] Optimizing images...');
    const galleryItems = [];
    const entries = Object.entries(insightsData);

    // 画像クリーンアップ: dist/images/ は 14日以上前を削除
    const retentionDays = 14;
    const now = Date.now();
    if (fs.existsSync(imageOutDir)) {
        fs.readdirSync(imageOutDir).forEach(file => {
            const filePath = path.join(imageOutDir, file);
            const stats = fs.statSync(filePath);
            const ageDays = (now - stats.mtimeMs) / (1000 * 60 * 60 * 24);
            if (ageDays > retentionDays) {
                console.log(`[Cleanup] Removing old image: ${file}`);
                fs.unlinkSync(filePath);
            }
        });
    }

    // tmp_img/ クリーンアップ: 処理済み生ファイルを削除
    if (fs.existsSync(tempDir)) {
        fs.readdirSync(tempDir).forEach(file => {
            const filePath = path.join(tempDir, file);
            if (fs.statSync(filePath).isFile()) {
                fs.unlinkSync(filePath);
            }
        });
    }

    // アーカイブクリーンアップ: data/archives/ から90日以上前のファイルを削除
    const ARCHIVE_RETENTION_DAYS = 90;
    const srcArchiveDir = path.join(dataDir, 'archives');
    const distArchiveDir = path.join(distDir, 'archives');
    if (fs.existsSync(srcArchiveDir)) {
        const cutoff = new Date();
        cutoff.setDate(cutoff.getDate() - ARCHIVE_RETENTION_DAYS);
        const deletedCount = pruneArchives(srcArchiveDir, cutoff);
        if (deletedCount > 0) {
            console.log(`[Archive] Cleaned up ${deletedCount} archive file(s) older than ${ARCHIVE_RETENTION_DAYS} days.`);
        }
    }

    if (fs.existsSync(srcArchiveDir)) {
        console.log('[Gallery] Copying archives and generating manifest...');
        fs.mkdirSync(distArchiveDir, { recursive: true });

        const allDates = [];
        const copyRecursive = (src, dest) => {
            if (!fs.existsSync(dest)) fs.mkdirSync(dest, { recursive: true });
            fs.readdirSync(src).forEach(file => {
                const srcPath = path.join(src, file);
                const destPath = path.join(dest, file);
                const stat = fs.statSync(srcPath);
                if (stat.isDirectory()) {
                    copyRecursive(srcPath, destPath);
                } else if (file.endsWith('.json')) {
                    fs.copyFileSync(srcPath, destPath);
                    // data/archives/2026/03/20.json → 2026-03-20
                    const rel = path.relative(srcArchiveDir, srcPath).split(path.sep);
                    const year = rel[0];
                    const month = rel[1];
                    const day = file.replace('.json', '');
                    if (year && month && day) allDates.push(`${year}-${month}-${day}`);
                }
            });
        };
        copyRecursive(srcArchiveDir, distArchiveDir);

        const manifest = allDates.sort().reverse();
        fs.writeFileSync(path.join(distArchiveDir, 'manifest.json'), JSON.stringify(manifest), 'utf-8');
        console.log(`[Gallery] Manifest generated with ${manifest.length} dates.`);
    }

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

if (require.main === module) {
    main().catch(error => {
        console.error('CRITICAL ERROR:', error.message || error);
        process.exit(1);
    });
}

module.exports = { downloadImageToFile, pruneArchives };
