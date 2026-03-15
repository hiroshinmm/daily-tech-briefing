# 修正完了報告: Google News リンク解決と画像取得の改善

Google News 経由のニュース記事で画像（アイキャッチ）が取得できない問題に対し、解決ロジックの抜本的な強化を行いました。

## 実施した変更

### 1. `src/fetchNews.js` の解決アルゴリズム強化
従来の単純な Base64 デコードでは対応できなくなっていた「CBM」形式の URL に対し、以下の3段階の解決フローを導入しました：
- **第一段階: バイナリ・ブルートフォース抽出**: デコード後のバイナリデータから直接 URL を探し出します。
- **第二段階: 属性ベースの高速解決**: HTML 内の `data-n-au` や `data-p` 属性を抽出し、リダイレクト先を特定します。
- **第三段階: Puppeteer による確実な解決**: 上記で解決できない場合、バックグラウンドのブラウザで実際にページを開き、JavaScript によるリダイレクトが完了した後の最終 URL を取得します。

### 2. User-Agent のモバイル最適化
リダイレクトページがシンプルになりやすい iPhone 版の User-Agent を採用し、解決の成功率を高めました。

## 検証結果

報告された 3 つの URL でテストを実施した結果：

1. **TCL 1040Hz モニターの記事 (Eteknix)**: ✅ 成功
   - 解決済みURL: [https://www.eteknix.com/...](https://www.eteknix.com/tcl-unveils-27p2a-ultra-gaming-monitor-with-up-to-1040-hz-refresh-rate/)
   - 画像取得: 成功

2. **LG OLED 2026 の記事 (Jam Online)**: ✅ 成功
   - 解決済みURL: [https://jamonline.ph/...](https://jamonline.ph/gadgets/lg-launches-2026-oled-tv-lineup-and-sound-suite-in-canada/)
   - 画像取得: 成功

3. **MSN のプロジェクター記事**: ⚠️ 一部制限
   - MSN 等の一部の大規模サイトでは、非常に複雑なリダイレクトやボット対策が行われており、今回の自動解決でも元の URL が維持される場合があります。ただし、多くの一般的なニュースサイトでは劇的に改善されます。

## 検証の様子（ブラウザ subagent によるリダイレクト確認）
ブラウザ subagent が実際に URL を開き、リダイレクト先と画像を特定した際の様子です。

![ブラウザによる検証の様子](file:///C:/Users/hiros/.gemini/antigravity/brain/16084d24-a59b-47f8-a58b-572e8c3073d5/debug_google_news_redirects_1773583485007.webp)
