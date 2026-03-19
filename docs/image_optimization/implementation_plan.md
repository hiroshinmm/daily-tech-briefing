# 画像の復旧とリサイズ（メール最適化）

Google News のレート制限によって画像が取得できない問題の改善と、メール添付に適した画像サイズへの最適化を行います。

## ユーザーレビューが必要な項目

- 画像サイズを横幅 400px、画質 50% に縮小します。さらに小さくする必要がある場合はお知らせください。

## 提案される変更点

### URL 解決の強化 (urlUtils)

#### [MODIFY] [urlUtils.js](file:///c:/Users/hiros/OneDrive/デスクトップ/Antigravity/Ice%20Break/src/urlUtils.js)
- `resolveUrlOnline` で `news.google.com` からのリダイレクトをより確実に追跡するため、デスクトップ用 User-Agent と `Referer` ヘッダーを追加します。

### インサイト生成 (generateInsights)

#### [MODIFY] [generateInsights.js](file:///c:/Users/hiros/OneDrive/デスクトップ/Antigravity/Ice%20Break/src/generateInsights.js)
- `resolveUrlWithPuppeteer` での待機時間を調整し、Google の「Sorry」ページを回避（またはより粘り強く解決）できるように改善します。

### 画像の最適化 (captureSlides)

#### [MODIFY] [captureSlides.js](file:///c:/Users/hiros/OneDrive/デスクトップ/Antigravity/Ice%20Break/src/captureSlides.js)
- `resizeImageWithPuppeteer` の設定を変更し、メール添付に最適なサイズに調整します。
  - 横幅: 600px -> **400px**
  - JPEG 画質: 60 -> **50**

## 検証計画

### 自動テスト（コマンド実行）
1. `node src/generateInsights.js` を実行し、Google News のリンクが以前より高い確率で解決されることを確認。
2. `node src/captureSlides.js` を実行し、`dist/images` 内の各画像ファイルサイズが 50KB 前後（またはそれ以下）になっていることを確認。

### 手動検証
- 生成されたメール用インライン画像を目視し、十分な視認性を保ちつつファイルサイズが削減されていることを確認。
