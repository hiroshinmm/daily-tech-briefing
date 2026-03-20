# 実装計画 (Implementation Plan)

## 概要
- `index.ejs` の文字サイズ変更
- ドキュメント内のモデル情報を `gemini-3.1-flash-lite-preview` に引き上げ
- docs フォルダの過去フォルダのアーカイブ化

## 実行ステップ
1.  **CSS修正**: `src/templates/index.ejs` の `.card-insight-content` を 15px に変更。
2.  **要件定義更新**: `docs/requirements_specification.md` の LLM バージョンと文字サイズ統一の旨を追記。
3.  **設計仕様更新**: `docs/design_specification.md` の文字サイズおよび日時を更新。
4.  **フォルダ整理**: `docs` 以下の未整理フォルダを `archived_tasks` へ移動。
5.  **現在の作業記録**: `docs/align_font_and_model_update` に本作業の記録を保存。

## メリット
- 実装とドキュメントが一致し、情報の信頼性が高まる。
- ギャラリーのテキストが等長でない場合でも、文字サイズが揃っていることで見た目の違和感を軽減。
- docs フォルダのノイズを減らし、開発・運用コストを低減。
