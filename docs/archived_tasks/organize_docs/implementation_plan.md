# 整理計画

## 概要
`docs` フォルダの下に多数ある過去のタスクフォルダをアーカイブし、重要ドキュメントのみをルートに配置します。

## 提案するディレクトリ構造
```
docs/
├── archived_tasks/  (過去のタスク記録)
│   ├── ai_image_generation/
│   ├── fix_jst_date/
│   └── ...
├── organize_docs_folder/ (本タスクの記録)
│   ├── task.md
│   ├── implementation_plan.md
│   └── walkthrough.md
├── requirements_specification.md (最新版)
└── design_specification.md (最新版)
```

## 実施ステップ
1. `docs/archived_tasks/` の作成。
2. 全てのタスクフォルダ（`implementation_plan.md`等を含むもの）を `archived_tasks/` に移動。
3. `design_specification/design_specification.md` を `docs/design_specification.md` に移動し、フォルダを削除。
4. `requirements_specification.md` を最新の内容に統合。
5. 本整理タスクの記録用フォルダ `docs/organize_docs/` を作成し、各種ドキュメントを保存。
6. `docs/organize_docs/` 内のドキュメント作成。
