# テスト仕様書

## 1. テスト方針

- **フレームワーク**: Jest (v29)
- **対象**: ユニットテスト（外部API・Puppeteer に依存しない純粋関数および非同期ロジック）
- **実行**: `npm test` でローカル/CI両環境から実行可能
- **配置**: `tests/unit/*.test.js`

外部依存（Gemini API、Puppeteer、実際のHTTPフェッチ）はモックで代替し、ロジックの正確性のみを検証する。

---

## 2. テスト対象モジュール

### 2.1 `src/urlUtils.js`

| テストID | 対象関数 | 入力 | 期待結果 |
|----------|----------|------|----------|
| UU-01 | `decodeGoogleNewsUrl` | Google News以外のURL | 入力をそのまま返す |
| UU-02 | `decodeGoogleNewsUrl` | CBM形式のGoogle News URL（httpを含む） | デコードされたオリジナルURL |
| UU-03 | `decodeGoogleNewsUrl` | httpを含まないCBMペイロード | 入力をそのまま返す |
| UU-04 | `decodeGoogleNewsUrl` | 不正なURLフォーマット | 入力をそのまま返す（例外なし） |
| UU-05 | `getRandomUA` | なし | `USER_AGENTS` 配列内の文字列 |
| UU-06 | `USER_AGENTS` | なし | 1件以上の非空文字列配列 |
| UU-07 | `PUPPETEER_ARGS` | なし | `--no-sandbox` を含む配列 |
| UU-08 | `resolveUrlOnline` | `/rss/articles/` を含むURL、fetchが非Google URLを返す | 解決後のURL |
| UU-09 | `resolveUrlOnline` | fetchがエラー | 元のURLを返す |
| UU-10 | `resolveUrlOnline` | fetchが常にgoogle.com URLを返す | 元のURLを返す |

### 2.2 `src/config.js`

| テストID | 対象 | 確認内容 |
|----------|------|----------|
| CF-01 | `DAYS_TO_FETCH` | 正の数値 |
| CF-02 | `GEMINI_MODEL` | 非空文字列 |
| CF-03 | `GEMINI_MODEL` | `GEMINI_MODEL` 環境変数でオーバーライド可能 |
| CF-04 | `feeds` | 10カテゴリすべて存在する |
| CF-05 | `feeds` | 各カテゴリに1件以上のURL |
| CF-06 | `feeds` | 全フィードURLが `https://` で始まる |

### 2.3 `src/fetchNews.js`

| テストID | 対象関数 | 入力 | 期待結果 |
|----------|----------|------|----------|
| FN-01 | `isRecent` | `null` | `false` |
| FN-02 | `isRecent` | `undefined` | `false` |
| FN-03 | `isRecent` | 今日のISO日時、window=7 | `true` |
| FN-04 | `isRecent` | 昨日のISO日時、window=7 | `true` |
| FN-05 | `isRecent` | 8日前のISO日時、window=7 | `false` |
| FN-06 | `isRecent` | 6日前のISO日時、window=7 | `true` |

### 2.4 `src/generateInsights.js`

| テストID | 対象関数 | シナリオ | 期待結果 |
|----------|----------|----------|----------|
| GI-01 | `generateContentWithRetry` | 初回成功 | レスポンスを返す（1回呼び出し） |
| GI-02 | `generateContentWithRetry` | 429エラー → 2回目成功 | レスポンスを返す（2回呼び出し） |
| GI-03 | `generateContentWithRetry` | maxRetries回連続失敗 | 例外をスロー |
| GI-04 | `generateContentWithRetry` | 非レートリミットエラー | 即座に例外スロー（1回呼び出し） |
| GI-05 | `generateContentWithRetry` | 503サーバーエラー → 成功 | リトライして成功 |

### 2.5 `src/generateGallery.js`

| テストID | 対象関数 | シナリオ | 期待結果 |
|----------|----------|----------|----------|
| GG-01 | `downloadImageToFile` | imageUrlがnull | `null` を返す |
| GG-02 | `downloadImageToFile` | fetchが非OKレスポンス | `null` を返す |
| GG-03 | `downloadImageToFile` | fetchが成功・ファイル書き込み成功 | `destPath` を返す |
| GG-04 | `downloadImageToFile` | fetchがネットワークエラー | `null` を返す |

---

## 3. モック戦略

| 外部依存 | モック方法 |
|----------|------------|
| `global.fetch` | `jest.fn()` でレスポンスを直接差し替え |
| Gemini APIモデル | `{ generateContent: jest.fn() }` オブジェクトを注入 |
| `fs.writeFileSync` | `jest.spyOn(fs, 'writeFileSync')` |
| `setTimeout`（リトライ遅延）| `jest.spyOn(global, 'setTimeout').mockImplementation(fn => fn())` |
| `puppeteer` | `jest.mock('puppeteer')` でモジュール全体をモック |

---

## 4. 実行コマンド

```bash
# 全テスト実行
npm test

# watchモード（開発中）
npx jest --watch

# カバレッジレポート
npx jest --coverage
```

---

*最終更新日: 2026年4月26日*
