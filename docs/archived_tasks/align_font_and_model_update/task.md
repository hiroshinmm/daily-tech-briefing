# タスク: 文字サイズ統一およびモデル情報の同期

## 目的
- ギャラリー表示における「要約」と「インサイト」の文字サイズが異なっていたため、15pxに統一する。
- 要件定義書に記載されていた古いGeminiモデル情報を、現在の実装（3.1-flash-lite）に合わせて最新化する。
- 散らかっていた `docs` フォルダ内を整理する。

## 完了条件
- [x] `src/templates/index.ejs` の文字サイズが15pxで統一されている。
- [x] `docs/requirements_specification.md` のモデル名が `gemini-3.1-flash-lite-preview` に更新されている。
- [x] `docs/design_specification.md` が最新の状態に更新されている。
- [x] 過去の完了済みタスクフォルダが `archived_tasks` に移動されている。
- [x] メールのフッターおよび送信者名を "Daily Tech Briefing" に統一。
- [x] メールの「Technical Insight」から💡アイコンを削除。
