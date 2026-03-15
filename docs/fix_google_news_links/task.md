# タスクリスト: Google News リンク解決と画像取得の改善

- [x] `fetchNews.js` の改修
    - [x] `decodeGoogleNewsUrl` のバイナリ抽出（latin1）対応
    - [x] `resolveUrlOnline` の `data-n-au` / `data-p` 検索対応
    - [x] User-Agent のモバイル向け切り替え
    - [x] 最終手段としての Puppeteer 解決ロジックの統合
- [x] 動作検証
    - [x] 問題の 3 URL を使用したテスト実行
    - [x] `og:image` が取得できるか確認（2/3 で成功を確認）
- [x] ドキュメント作成
    - [x] 実装計画の作成
    - [x] Walkthrough の作成
- [x] GitHub への反映
