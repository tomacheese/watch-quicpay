# GitHub Copilot Instructions

## プロジェクト概要
- 目的: QUICPay のキャンペーン情報を監視し、新規情報があれば Discord に通知する。
- 主な機能: QUICPay 公式サイトのスクレイピング、Discord への Embed 通知、通知済みキャンペーンの管理。
- 対象ユーザー: QUICPay のキャンペーン情報をいち早く知りたいユーザー。

## 共通ルール
- 会話は日本語で行う。
- PR とコミットは [Conventional Commits](https://www.conventionalcommits.org/en/v1.0.0/) に従う。
  - `<type>(<scope>): <description>` 形式。
  - `<description>` は日本語で記載する。
- 日本語と英数字の間には半角スペースを入れる。

## 技術スタック
- 言語: TypeScript
- 実行環境: Node.js (tsx)
- パッケージマネージャー: pnpm
- ライブラリ:
  - スクレイピング: axios, cheerio
  - ユーティリティ: @book000/node-utils
  - 通知: Discord Webhook

## 開発コマンド
```bash
# 依存関係のインストール
pnpm install

# 実行
pnpm start

# 開発モード（ウォッチモード）
pnpm dev

# テスト
pnpm test

# リンター実行
pnpm lint

# コード修正（Prettier/ESLint）
pnpm fix

# 設定スキーマの生成
pnpm generate-schema
```

## コーディング規約
- TypeScript を使用し、型安全性を確保する。
- `skipLibCheck` によるエラー回避は禁止。
- インターフェースには日本語で JSDoc を記載する（関数への JSDoc 記載は今後の方針として推奨）。
- エラーメッセージは英語で記載する。
- 既存のコードスタイル（Prettier, ESLint）を尊重する。

## テスト方針
- テストフレームワーク: Jest (ts-jest)
- 新しい機能やロジックを追加した場合は、対応するテストコードを追加する。
- `src/quicpay-campaigns.test.ts` を参考にする。

## セキュリティ / 機密情報
- `config.json` などの設定ファイルに認証情報（Discord Webhook URL など）を含めてコミットしない。
- ログに機密情報を出力しない。

## ドキュメント更新
- `README.md`
- `schema/Configuration.json` (設定項目が変更された場合)

## リポジトリ固有
- スクレイピング対象のサイト構造が変更された場合は、`src/quicpay-campaigns.ts` を更新する必要がある。
- 通知済み情報の管理は `data/notified.json` (デフォルト) で行われる。
