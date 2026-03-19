# 実装計画: ニュースのオリジナル画像優先使用

ニュース記事のオリジナル画像（RSSから取得可能）が存在する場合、それをスライドのメイン画像として優先的に使用するように変更します。画像が存在しない場合のみ、Pollinations.ai によるAI画像生成を実行します。

## プロセス概要
1.  **ニュース取得 (`src/fetchNews.js`)**: RSS フィードから `enclosure` や `media:content` などのタグを解析し、画像の URL を抽出して `news.json` に保存します。
2.  **インサイト生成 (`src/generateInsights.js`)**: 抽出されたニュースの中から Gemini が記事を選定する際、その記事に紐づく画像 URL も `insights.json` へ引き継いで保存します。
3.  **スライド制作 (`src/captureSlides.js`)**: 保存された画像 URL がある場合はそれを使用し、ない場合は従来通り AI へのプロンプトを用いて画像を生成します。

## 変更内容

### 1. `src/fetchNews.js` [MODIFY]
- `fetchCategoryNews` 関数内のアイテム整形ロジックを更新。
- `enclosure`, `media:content`, `media:thumbnail` 等から画像 URL を抽出するロジックを追加。

### 2. `src/generateInsights.js` [MODIFY]
- Gemini の出力 JSON に画像 URL を直接含めるのは難しいため（Gemini は外部 URL を知らない）、プロンプトで選定された記事のインデックスに基づき、元データから画像 URL を抽出して `insights.json` に保存する。

### 3. `src/captureSlides.js` [MODIFY]
- `imageUrl` の決定ロジックを以下のように変更：
  - `insight.originalImageUrl` が存在すればそれを使用。
  - なければ Pollinations.ai の URL を構築。

## 検証プラン

### 自動テスト / 実行確認
1.  `node src/fetchNews.js` を実行し、`data/news.json` に `imageUrl` フィールドが含まれていることを確認。
2.  `node src/generateInsights.js` を実行し、`data/insights.json` に選定された記事の画像 URL が正しく保存されていることを確認。
3.  `node src/captureSlides.js` を実行し、デバッグログで「Original image found」または「Generating AI Image」が期待通りに出力されることを確認。

### 手動確認
- 生成されたスライド画像 (`dist/images/*.png`) を開き、実写画像（ニュースサイトのもの）または AI 生成画像が正しく表示されているか目視で確認。
