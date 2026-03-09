# 実装計画: AI 画像生成の導入 (Pollinations.ai 移行)

## 概要
キーワードによる画像検索（LoremFlickr/Unsplash）を廃止し、Gemini が生成した詳細なプロンプトを用いた **AI 画像生成** へ移行します。これにより、ニュース記事の内容を完全に反映した独自の画像を生成し、視覚的な関連性とインパクトを最大化します。

## 修正内容

### 1. `src/captureSlides.js` の修正
- **画像取得方法の変更**: 従来の検索 URL を AI 生成 URL（Pollinations.ai）へ差し替えます。
- **詳細プロンプトの活用**: 絞り込んだキーワードではなく、Gemini が精緻に作成した `imagePrompt` をそのままプロンプトとして使用します。
- **URL 構築**:
  ```javascript
  const seed = Math.floor(Math.random() * 1000000);
  // 画像はスライドの右半分（約960x1080）に表示されるため、生成サイズを 1024x1024 に調整して効率化。
  const imageUrl = `https://image.pollinations.ai/prompt/${encodeURIComponent(insight.imagePrompt)}?width=1024&height=1024&nologo=true&seed=${seed}`;
  ```
  - `nologo=true`: 透かしを排除。
  - `seed`: 毎回新しい画像を生成するためのランダム要素。

### 2. `src/generateInsights.js` の修正 (必要に応じて)
- AI 画像生成に適した、より具体的で芸術的なプロンプト（"digital art, cinematic lighting, 8k" など）を出力するように Gemini への指示を微調整します。

## 期待される効果
- 検索キーワードの一致に頼らず、記事のタイトルや文脈に完璧に合致した独自の画像が表示される。
- プレミアムで一貫性のある「毎日新しい」ビジュアル体験。

## 検証プラン
- `captureSlides.js` を実行し、生成された PNG がニュース内容に沿った AI 生成画像であることを確認する。
