# 要約文字数の変更計画 (150 -> 200文字)

## 概要
ニュース要約の文字数をこれまでの150文字から200文字に拡大し、より詳細な情報を盛り込めるようにします。

## 対応内容
1.  **AI プロンプト修正**:
    -   `src/generateInsights.js` の Gemini への指示文を `around 150 characters` から `around 200 characters` に変更。
2.  **仕様書更新**:
    -   `docs/requirements_specification.md` の記述を修正。
    -   `docs/design_specification.md` の記述を修正。
3.  **完了報告作成**:
    -   `docs/update_summary_limit/walkthrough.md` を作成。
