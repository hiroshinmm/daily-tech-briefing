# タスクリスト: リファクタリングおよび信頼性向上のための更新

## 完了したタスク
- [x] **P1: メール通知の EJS テンプレート化**
  - `src/templates/email.ejs` の作成
  - `src/sendNotification.js` のリファクタリング
- [x] **P0: ニュース取得・分析の安定化**
  - Gemini API へのリトライロジック追加 (`generateInsights.js`)
  - 環境変数のバリデーション追加
  - Puppeteer のアンチブロック（ボット検知回避）引数の強化
- [x] **スクリプト名のリネーム**
  - `src/captureSlides.js` を `src/generateGallery.js` へ変更
  - `.github/workflows/daily-tech-briefing.yml` 内の参照を更新
- [x] **ドキュメントの更新**
  - `design_specification.md` の更新
  - `requirements_specification.md` の更新
- [x] **画像最適化処理の改善**
  - `generateGallery.js` での並列処理（2件ずつ）の実装
  - User-Agent のランダム化
