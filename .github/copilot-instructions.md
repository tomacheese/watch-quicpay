# GitHub Copilot Instructions

QUICPay 公式サイトのキャンペーン情報を監視し、新規情報を Discord に通知する TypeScript アプリケーション。コードレビュー時に重点確認すべき事項を示す。

## 技術スタック
- 言語 / 実行: TypeScript, Node.js (tsx), pnpm。
- スクレイピング: 標準 `fetch` + `cheerio` (axios は使用しない)。
- ユーティリティ: `@book000/node-utils` (`Logger` など)。
- 通知: Discord Webhook / Bot。

## レビュー時の重点確認事項
- 認証情報 (Discord Webhook URL、Bot token) が設定ファイル・ログ・テストに含まれていないこと。
- エラーメッセージは英語で記載されていること。コメントは日本語であること。
- `skipLibCheck` によるエラー回避が導入されていないこと。
- スクレイピング (`src/quicpay-campaigns.ts`) では、取得結果が期待した DOM 構造でない場合に握りつぶさず明示的にエラーを投げていること。
- 設定の型 (`src/config.ts` の `Configuration`) を変更した場合、`schema/Configuration.json` の再生成 (`pnpm generate-schema`) が伴っていること。
- 通知済み判定 (`src/notified.ts`) の変更で、既存通知の再送や取りこぼしが起きないこと。

## コーディング規約 (lint/formatter で強制)
- フォーマットは Prettier、Lint は ESLint (`pnpm lint` で prettier / eslint / tsc を実行)。
- 命名は camelCase (関数・変数)、PascalCase (クラス・インターフェース)。
- 日本語と英数字の間には半角スペースを入れる。
- インターフェースには日本語で JSDoc を記載する。

## テスト
- Jest (ts-jest)。パースなど壊れやすいロジックを追加・変更した場合はテスト追加を期待する。`src/quicpay-campaigns.test.ts` を参照。

## フラグ不要な既知パターン
- `src/config.ts` の型ガード内にある `@typescript-eslint/no-unsafe-*` の `eslint-disable` コメントは、外部入力の検証のため意図的なもの。
- ログ出力やコミットメッセージ中の絵文字はプロジェクトの慣習であり問題ない。
