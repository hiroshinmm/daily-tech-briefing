# デイリー・テックブリーフィング 設計仕様書

## 1. システムアーキテクチャ
本システムは、ニュースの収集、AIによる分析、視覚化、および通知を自動化するサーバーレスアーキテクチャを採用しています。実行環境として **GitHub Actions** を利用し、静的コンテンツを **GitHub Pages** で公開します。

### 処理フロー
6.  **収集 (Fetch)**: RSSフィードおよびGoogle Newsからカテゴリ別のニュースを取得。
7.  **分析 (Insight)**: Gemini APIを用いて重要ニュースを抽出し、要約と技術インサイトを生成。
8.  **画像抽出 (Images)**: 記事のOGP画像を取得。Puppeteerで動的な解決も実施。
9.  **構成 (Assemble)**: EJSテンプレートを用いてWebギャラリー（index.html）を生成。画像はWebから取得したものを直接参照または軽量化して利用。
11. **公開 (Deploy)**: 生成物を `dist` フォルダに集約し、GitHub Pagesにデプロイ。
12. **アーカイブ (Archive)**: その日の JSON を `data/archives/` に永続化し、GitHub リポジトリへ自動コミット。
13. **通知 (Notify)**: 更新内容をメール（Nodemailer）で送信。アーカイブへのリンクも含む。

---

## 2. コンポーネント詳細

### 2.1 ニュース収集 (`src/fetchNews.js`)
- **方式**: `rss-parser` を用いて複数のフィードを並列取得。
- **期間**: 直近7日間 (`config.DAYS_TO_FETCH`) の記事を対象。
- **フィルタリング**: タイトルとリンクによる重複排除を行い、上位20件を保持。
- **出力**: `data/news.json`
- **テスト**: `isRecent` 関数をエクスポートし、ユニットテスト対象。

### 2.2 AI分析・画像抽出 (`src/generateInsights.js`)
- **LLM**: Google Gemini API（デフォルト: `gemini-3.1-flash-lite-preview`、環境変数 `GEMINI_MODEL` でオーバーライド可）
    - 役割: 各カテゴリから1件を厳選、200文字要約、技術的インサイトの生成。
- **リンク解決**: Google Newsの短縮・リダイレクトURLを `urlUtils.js` または Puppeteer でデコードし、オリジナルの記事URLを特定。
- **画像抽出**:
    - `fetch` による OGP (og:image) および Twitter Card 取得。
    - 取得失敗時は Puppeteer でページをレンダリングし、ヒューリスティックな画像抽出を実施。
- **エラー処理**: Gemini APIの JSON パース失敗を個別にキャッチし、カテゴリ単位でスキップ（全体は継続）。
- **出力**: `data/insights.json`
- **テスト**: `generateContentWithRetry` 関数をエクスポートし、ユニットテスト対象。

### 2.3 ギャラリー生成 (`src/generateGallery.js`)
- **レンダリング**: EJSテンプレート (`src/templates/index.ejs`) を使用。
- **画像管理**:
    - 各記事のオリジナル画像URLを直接使用、または軽量化したキャッシュ画像を表示。
    - `dist/images/` は14日以上前の画像を自動削除。
    - `tmp_img/` の生ダウンロードファイルは処理完了後に自動削除。
- **アーカイブパス**: `path.relative()` を用いたクロスプラットフォーム対応のパス解析。
- **出力**: `dist/index.html` (Webギャラリー)
- **テスト**: `downloadImageToFile` 関数をエクスポートし、ユニットテスト対象。

### 2.4 通知機能 (`src/sendNotification.js`)
- **方式**: Nodemailer による Gmail SMTP 送信。
- **内容**: カテゴリごとの技術インサイト本文と、HTMLメール内でのオリジナル画像表示（スライド画像の添付は廃止）。
- **セキュリティ**: EJSテンプレートは `<%= %>` エスケープ出力を使用し、XSS を防止。

### 2.5 共通ユーティリティ (`src/urlUtils.js`)
- **URL解決**: `decodeGoogleNewsUrl`（オフライン）、`resolveUrlOnline`（HTTPフォールバック）。
- **共有定数**: `USER_AGENTS`、`getRandomUA()`、`PUPPETEER_ARGS` を全スクリプトで共有。重複定義を排除。

### 2.6 アーカイブ管理 (`data/archives/`)
- **JSON永続化**: 各日の `insights.json` を `YYYY/MM/DD.json` 形式で保存。
- **マニフェスト**: 全アーカイブ日をリスト化した `manifest.json` を自動生成。
- **自動クリーンアップ**: `dist/images/` 内の画像は 14日経過後に自動削除し、リポジトリ容量を節約。

---

## 3. データ設計

### ニュースデータ (`news.json`)
```json
{
  "AI": [
    {
      "title": "...",
      "link": "...",
      "pubDate": "...",
      "source": "...",
      "imageUrl": "...",
      "snippet": "..."
    }
  ]
}
```

### インサイトデータ (`insights.json`)
```json
{
  "AI": {
    "title": "スライド見出し",
    "summary": "200文字要約",
    "insight": "技術的考察",
    "sourceUrl": "元記事リンク",
    "sourceName": "メディア名",
    "originalImageUrl": "抽出画像URL",
    "displayDate": "YYYY-MM-DD"
  }
}
```

---

## 4. UI/UX デザイン設計
- **タイポグラフィ**: Google Fonts 'Outfit'（モダン・プレミアムな印象）。
- **グリッドシステム**:
    - デスクトップ: 2カラム（最大幅 1800px）。
    - モバイル: 1カラム（ブレークポイント 1100px）。
- **配色**: グラデーション背景とホワイトベースのカードデザインによる「モダンな技術誌」風の演出。
- **セキュリティ**: アーカイブ表示の `renderGrid()` は DOM API を使用し、`innerHTML` を廃止。外部リンクには `rel="noopener noreferrer"` を付与。

---

## 5. インフラ・自動化 (CI/CD)
- **GitHub Actions**:
    - スケジュール: 毎日 23:00 UTC (日本時間 8:00 AM)。
    - トリガー: `schedule` および `workflow_dispatch`（手動実行）。
    - 依存関係インストール: `npm ci`（決定論的ビルド）。
    - 環境変数: `GEMINI_API_KEY`, `GMAIL_USER`, `GMAIL_PASS` 等。
- **セキュリティ**: APIキーやパスワードは GitHub Secrets で管理。

---

## 6. 開発・テスト

### ローカル実行スクリプト
```bash
npm run fetch      # ニュース収集のみ
npm run insights   # AI分析のみ
npm run gallery    # ギャラリー生成のみ
npm run notify     # メール送信のみ
npm run generate   # fetch → insights → gallery（フルパイプライン）
npm run check-urls # フィードURL疎通確認
npm test           # ユニットテスト実行
```

### テスト
- **フレームワーク**: Jest v29
- **配置**: `tests/unit/`
- **対象**: `urlUtils`, `config`, `fetchNews`, `generateInsights`, `generateGallery`
- **詳細**: [docs/test_specification.md](test_specification.md) を参照。

---

*最終更新日: 2026年4月27日*
