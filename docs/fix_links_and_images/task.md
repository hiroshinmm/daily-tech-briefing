# タスク: リンク解決と画像表示の不具合修正

- [x] リンク解決（Bot検知回避）の修正
    - [x] `src/urlUtils.js`: `resolveUrlOnline` のヘッダー強化と `google.com/sorry` 回避
    - [x] `src/generateInsights.js`: `sorry` リンクが `sourceUrl` に設定されるのを防止
- [x] 画像表示の修正
    - [x] `src/sendNotification.js`: 画像がない場合に `default_news.png` を表示するよう修正
    - [x] `src/sendNotification.js`: デフォルト画像を添付ファイルに追加
- [x] 最終確認
    - [x] テストスクリプトによるリンク解決の検証
    - [x] 完了報告 (Walkthrough)
