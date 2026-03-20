# リンク解決と画像表示の不具合修正計画

## 概要
Google News のリンクが Bot 検知（CAPTCHA）により正常に解決されず、リンク切れや画像の欠落が発生している問題を修正します。

## 修正内容
1.  **リンク解決の改善 (`src/urlUtils.js`, `src/generateInsights.js`)**:
    - `fetch` 時のヘッダーに `Referer` や `Accept-Language` を追加して Bot 検知を回避しやすくします。
    - 万が一 `google.com/sorry` ページにリダイレクトされた場合は、その URL を採用せず元の Google News リンクを保持するようにします。
2.  **メール内画像表示の改善 (`src/sendNotification.js`)**:
    - 記事の画像取得に失敗した場合でも、メール内でロゴ（`default_news.png`）が表示されるように修正します。
    - 画像が見つからない場合、添付ファイルに `default_news.png` を含め、`cid` 参照するように変更します。

## 実施ステップ
1. `urlUtils.js` の `resolveUrlOnline` を修正。
2. `generateInsights.js` のリンク採用ロジックを修正。
3. `sendNotification.js` のレイアウトと添付ロジックを修正。
4. 検証と報告。
