# 実装計画: リファクタリングおよび信頼性向上のための更新

## 概要
システムの堅牢性（P0）と保守性（P1）を向上させるため、アーキテクチャの微調整、エラーハンドリングの強化、およびテンプレートの分離を行う。

## フェーズ 1: P1 メンテナンス性の向上
### a) メールテンプレートの分離
- `src/templates/email.ejs` を新規作成し、HTML 構造を定義。
- `src/sendNotification.js` で `ejs` を使用して内容をレンダリングするようにリファクタリング。
### b) スクリプトの名称変更
- 役割が「スライド作成」から「ギャラリー生成・画像処理」に変更されているため、`captureSlides.js` を `generateGallery.js` へ変更。

## フェーズ 2: P0 運用の安定化
### a) API 通信の堅牢化
- `generateInsights.js` に `generateContentWithRetry` を実装し、Gemini API の一時的なエラーを許容。
### b) スクレイピング/URL解決の改善
- Puppeteer 起動引数に `--disable-blink-features=AutomationControlled` を追加。
- User-Agent を複数をリスト化し、ランダムに選択することでボット検知のリスクを低減。

## フェーズ 3: デプロイ設定とドキュメント
### a) GitHub Actions ワークフロー
- リネームした `src/generateGallery.js` を実行するように `.github/workflows/daily-tech-briefing.yml` を修正。
### b) 技術ドキュメント
- `requirements_specification.md` および `design_specification.md` を最新のスクリプト構成に合わせて更新。
