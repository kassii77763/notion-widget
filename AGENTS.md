# Notion Multi-Widget プロジェクト司令塔 (AGENTS.md)

このファイルは、AIエージェントの作業フロー・進行ルート（Graph）および品質ゲート（Harness）を規定する最上位の指示書です。

## 1. プロジェクト概要
- Notionの埋め込み枠で動作する多機能（時計・ポモドーロ・カウントダウン・環境音BGM）ウィジェット。
- 技術スタック: 純粋な HTML5 / Vanilla CSS / JavaScript (ES6+)。外部重厚フレームワーク不使用。

## 2. 関連規約へのリンク (Context Layer)
- デザイン・配色の詳細規約: [botanical_theme.md](file:///.agents/rules/botanical_theme.md)

## 3. 自律開発ワークフロー (Graph Loop)
AIエージェントはコードを変更する際、以下の状態遷移ループを遵守すること：
1. **[設計・実装ノード]**: `index.html`, `style.css`, `app.js` を改修する。
2. **[自動検証ノード]**: ターミナルで `node harness/test_runner.js` を実行する。
3. **[条件分岐エッジ]**:
   - ❌ `FAIL` の場合 ➔ 理由を分析し、自律的に [設計・実装ノード] へ戻って再修正（最大4ループ）。
   - ✅ `PASS` の場合 ➔ [Git Pushノード] へ進み、GitHub に変更を同期する。

## 4. 品質保証ルール (Harness Layer)
- テストコードは `harness/test_runner.js` に隔離されており、AIによる改ざんは禁止。
- 全項目 PASS を確認する前のコミットおよび Push は固く禁ずる。
