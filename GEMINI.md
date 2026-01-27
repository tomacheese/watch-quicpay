# GEMINI.md

## 目的
Gemini CLI 向けのコンテキストと作業方針を定義する。

## 出力スタイル
- 言語: 日本語
- トーン: 専門的かつ簡潔
- 形式: Markdown

## 共通ルール
- 会話は日本語で行う。
- コミットメッセージは Conventional Commits に従い、説明は日本語とする。
- 日本語と英数字の間には半角スペースを入れる。

## プロジェクト概要
- QUICPay のキャンペーン情報を監視し、Discord へ通知する TypeScript アプリケーション。

## コーディング規約
- フォーマット: Prettier
- 命名規則: camelCase (関数、変数), PascalCase (クラス、インターフェース)
- コメント: 日本語
- エラーメッセージ: 英語

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

# リンター
pnpm lint

# 修正
pnpm fix
```

## 注意事項
- 認証情報（Webhook URL）のコミット厳禁。
- 既存のコードスタイルとディレクトリ構成を尊重する。
- スクレイピング対象サイトの規約や負荷に配慮する。

## リポジトリ固有
- `src/quicpay-campaigns.ts` がスクレイピングの肝となる。
- `Notified` クラスが通知済み情報の永続化を担当している。
- 設定は `data/config.json` で管理される。
