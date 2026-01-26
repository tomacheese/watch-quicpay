# AGENTS.md

## 目的
エージェント共通の作業方針を定義する。

## 基本方針
- 会話は日本語で行う。
- コード内コメントは日本語で記載する。
- エラーメッセージは英語で記載する。
- コミットメッセージは Conventional Commits に従い、説明は日本語とする。

## 判断記録のルール
- 判断内容、代替案、採用理由、前提条件、不確実性を明示する。

## 開発手順（概要）
1. プロジェクト構成の理解（`package.json`, `src/` 等）。
2. `pnpm install` による依存関係のインストール。
3. 要件に基づいた実装の変更。
4. `pnpm test` および `pnpm lint` による検証。

## セキュリティ / 機密情報
- Discord Webhook URL などの認証情報をコミットしない。
- ログに機密情報を出力しない。

## リポジトリ固有
- スクレイピング対象: `https://www.quicpay.jp/campaign/`
- 通知先: Discord Webhook
- 設定ファイル: `config.json` (スキーマは `schema/Configuration.json`)
- 通知済み管理: `data/notified.json` (デフォルト)
