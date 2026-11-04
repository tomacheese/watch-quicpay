# GitHub Copilot Instructions

プロジェクトの概要・規約・守るべき不変条件は [AGENTS.md](../AGENTS.md) を参照すること。レビューは日本語で行う。

## レビュー時の重点確認事項

- 認証情報 (Discord Webhook URL、Bot token) が設定ファイル・ログ・テストに含まれていないこと。
- エラーメッセージは英語、コメントは日本語であること。
- `skipLibCheck` によるエラー回避が導入されていないこと。
- スクレイピング (`src/quicpay-campaigns.ts`) で、期待した DOM 構造でない場合に握りつぶさずエラーを投げていること。
- `Configuration` (`src/config.ts`) を変更した場合、`schema/Configuration.json` が再生成されていること。
- 通知済み判定 (`src/notified.ts`) の変更で、既存通知の再送や取りこぼしが起きないこと。
- インターフェースに日本語の JSDoc があること。
- スクレイピングに `axios` が導入されていないこと (標準 `fetch` + `cheerio`)。ログ出力は `@book000/node-utils` の `Logger` を使っていること。
- パースなど壊れやすいロジックの追加・変更にテストが伴っていること。

## フラグ不要な既知パターン

- `src/config.ts` の型ガード内にある `@typescript-eslint/no-unsafe-*` の `eslint-disable` コメントは意図的なもの。
- ログ出力やコミットメッセージ中の絵文字はプロジェクトの慣習であり問題ない。
