# 実装計画: 日本時間表示の修正

## 概要
GitHub Actions 等のサーバー環境（UTC）でも常に日本時間（JST）で日付が表示されるように修正します。

## 修正内容

### 1. `src/sendNotification.js`
- 日付取得部分を以下のように修正します。
  ```javascript
  const today = new Date().toLocaleDateString('ja-JP', { 
    timeZone: 'Asia/Tokyo', 
    month: 'short', 
    day: 'numeric' 
  });
  ```

### 2. `src/templates/index.ejs`
- EJS テンプレート内の日付表示を JST 指定に変更します。
  ```javascript
  <%= new Date().toLocaleDateString('ja-JP', { timeZone: 'Asia/Tokyo' }) %>
  ```

## 期待される結果
- メールのタイトルに正しい日本の日付（実行時点の JST）が表示される。
- Web サイトのヘッダーに正しい日本の日付が表示される。
