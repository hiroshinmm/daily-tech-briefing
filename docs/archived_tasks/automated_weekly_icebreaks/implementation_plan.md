# 自動IceBreak生成システム (Automated Weekly Icebreaks)

ソニーのディスプレイ開発ソフトウェアエンジニア向けに、毎週指定のトピックで最新技術トレンドを収集・スライド化し、Web公開とメール通知を行うエンドツーエンドのシステムの実装計画です。

## 1. 目標と概要
定例でのアイスブレークネタとして以下の8カテゴリーの情報を収集し、全自動でスライド生成、Web公開、通知を行います。
1. SRD / XR
2. Gaming Monitor
3. Production Monitor
4. Camera Control
5. Projector
6. LED Wall Display
7. SONY (自社動向)
8. TCL (競合動向)

## ターゲットRSSフィードおよび抽出ソース (事前検証済)
各カテゴリにつき、スクリプトにてステータスコード200 (アクセス可能・404なし) を確認した国内・海外のサイトを3～5つ選定しました。
※一部の海外主要メディア(TFTCentral等)はBotアクセス(403)を弾くため、安定自動稼働を優先し「Google News RSS」による特定トピック・特定サイトの検索結果を活用して情報を漏れなく網羅します。

### 1. SRD / XR
- [UploadVR](https://uploadvr.com/feed/) (海外)
- [Mogura VR](https://www.moguravr.com/feed/) (国内)
- Google News "XR / VR": `XR OR VR OR AR OR MR when:7d` (グローバル)
- Google News "Spatial Reality": `"Spatial Reality Display" when:7d` (グローバル)

### 2. Gaming Monitor
- [4Gamer.net](https://www.4gamer.net/rss/index.xml) (国内)
- [PC Watch](https://pc.watch.impress.co.jp/data/rss/1.0/pcw/feed.rdf) (国内)
- Google News "Gaming Monitor": `"Gaming Monitor" when:7d` (グローバル)
- Google News "OLED Monitor": `"OLED" AND "Monitor" when:7d` (グローバル)

### 3. Production Monitor
- [NewsShooter](https://www.newsshooter.com/feed/) (海外)
- [CineD](https://www.cined.com/feed/) (海外)
- [PRONews](https://www.pronews.jp/feed) (国内)
- [ProVideo Coalition](https://www.provideocoalition.com/feed/) (海外)

### 4. Camera Control (プロ向けカメラ・PTZ等)
- [SonyAlphaRumors](https://www.sonyalpharumors.com/feed/) (海外)
- [PetaPixel](https://petapixel.com/feed/) (海外)
- [DPReview](https://www.dpreview.com/feeds/news.xml) (海外)
- [デジカメWatch](https://dc.watch.impress.co.jp/data/rss/1.0/dcw/feed.rdf) (国内)

### 5. Projector
- [AV Watch](https://av.watch.impress.co.jp/data/rss/1.0/avw/feed.rdf) (国内)
- [Audioholics](https://www.audioholics.com/feed) (海外)
- Google News "Projector": `"Projector" AND ("Home Theater" OR "Laser" OR "4K") when:7d` (グローバル)
- Google News "プロジェクター": `プロジェクター AND (4K OR レーザー OR ホームシアター) when:7d` (国内)

### 6. LED Wall Display
- [rAVe [PUBS]](https://www.ravepubs.com/feed/) (海外)
- [Digital Signage Today](https://www.digitalsignagetoday.com/rss/) (海外)
- [LEDinside](https://www.ledinside.com/rss.xml) (海外)
- Google News "LED Wall": `"LED Wall" OR "MicroLED display" when:7d` (グローバル)

### 7. SONY (自社動向: ディスプレイ・カメラ・XR関連)
- Google News "Sony Global": `Sony AND (Display OR Monitor OR Camera OR XR) when:7d`
- Google News "ソニー 国内": `ソニー AND (ディスプレイ OR モニター OR カメラ OR XR) when:7d`

### 8. TCL (競合動向: テレビ・ディスプレイ関連)
- Google News "TCL Global": `TCL AND (Display OR Monitor OR TV OR MiniLED) when:7d`
- Google News "CSOT Global": `"CSOT" OR "China Star Optoelectronics Technology" when:7d`
- Google News "TCL 国内": `TCL AND (テレビ OR ディスプレイ OR モニター) when:7d`

## User Review Required
> [!IMPORTANT]
> Gemini APIを稼働させるには `GEMINI_API_KEY` の設定が必要です。事前に `.env` にて設定をお願いします。

## Proposed Changes

### Phase 1: 初期セットアップとニュース・考察収集
#### [MODIFY] package.json
Node.jsプロジェクトとしてセットアップし、必要なライブラリを追加します。`rss-parser`, `axios`, `@google/generative-ai`, `dotenv`, `puppeteer` など。

#### [NEW] .env / .env.template
Gemini API Keyなどを保存するための環境変数ファイルです（Gitへはコミット不可として扱います）。

#### [NEW] src/config.js
ターゲットカテゴリーと、対応するRSSフィードのURLやキーワード群を定義する設定ファイルです。

#### [NEW] src/fetchNews.js
構成ファイルの設定に基づき、RSSフィードを巡回。過去7日間のニュースを抽出し、キーワードによってフィルタリングするスクリプトです。

#### [NEW] src/generateInsights.js
Gemini API を利用して、取得したニュースから「エンジニア向けの深い考察（INSIGHT）」テキストを生成する処理を実装します。

### Phase 2: スライド画像生成とGitHub Pages公開
#### [NEW] src/generateSlideHtml.js
`insights.json` のデータを元に、A4 Landscape (1920x1080) ササイズのHTMLファイルを8枚分（カテゴリー分）生成するスクリプトです。
左ペインにテキスト、右ペインに画像を配置するプレミアムなデザイン（白基調）とします。

#### [NEW] src/captureSlides.js
Puppeteerを起動し、生成されたHTMLファイルを読み込んで高画質の画像 (`.png` または `.webp`) として保存します。

#### [NEW] src/index.html (テンプレート)
ブラウザからスライド化された画像を閲覧するためのギャラリーページです。

#### [NEW] .github/workflows/weekly-icebreak.yml
毎週特定の時間（水曜朝など）にGitHub Actions上で一連のスクリプト (`fetchNews` -> `generateInsights` -> `generateSlideHtml` -> `captureSlides`) を実行し、生成された画像と `index.html` を `gh-pages` ブランチにプッシュするワークフロー定義です。

## Verification Plan

### Automated Tests
- `node src/fetchNews.js` を実行し、正しく直近7日間のフィードが取得できるかコンソールログにて確認。
- `node src/generateInsights.js` を実行し、Gemini APIが正しく考察テキストを返すか確認（要APIキー）。
- `node src/generateSlideHtml.js` と `node src/captureSlides.js` の順で実行し、指定ディレクトリにデザインが適用された画像が出力されるか確認。

### Manual Verification
- 出力された画像をブラウザで目視確認し、レイアウト崩れやフォントの不自然さがないかチェック。
- GitHub Pages上で生成されたスライド画像画面（index.html）へアクセスできるか確認。
