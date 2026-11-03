# AGENTS.md

## 言語ルール

- コミットメッセージの説明、PR / Issue のタイトルと本文、コードコメント・docstring、ドキュメントは日本語で記載する。
- 日本語と英数字の間には半角スペースを入れる。
- 例外: 通知・ログなどの実行時文字列、日本語のデータパターン・フィクスチャ、引用、技術識別子、`package.json` (英語)。
- エラーメッセージは英語で記載する。
- ワークフローのフォーク PR 承認コメントの文言と `body-includes` の一致キー (`Environment 承認待ち`) は、互いに一致している必要があるため変更しない。

## 概要

QUICPay 公式サイトのキャンペーン一覧 (`https://www.quicpay.jp/campaign/`) を監視し、新規キャンペーンを Discord に Embed で通知する。TypeScript / Node.js (tsx 実行) / pnpm。Docker では 30 分間隔で繰り返し実行する (`entrypoint.sh`)。

## 開発コマンド

```bash
pnpm install          # 依存関係のインストール
pnpm start            # 実行 (tsx ./src/main.ts)
pnpm dev              # 開発モード (watch)
pnpm test             # テスト (Jest)
pnpm lint             # prettier / eslint / tsc をまとめて実行
pnpm fix              # prettier / eslint による自動修正
pnpm generate-schema  # schema/Configuration.json を再生成
```

## アーキテクチャ

- `src/main.ts`: エントリーポイント。取得・判定・通知の全体フロー。
- `src/quicpay-campaigns.ts`: `cheerio` によるスクレイピングとパース。サイト構造の変更時はここを更新する。
- `src/discord.ts`: Discord 通知 (Webhook / Bot、Bot の場合は常にクロスポストを試み、失敗は無視する)。
- `src/config.ts`: 設定の読み込み・検証と型 (`Configuration`)、パス定義 (`PATH`)。
- `src/notified.ts`: 通知済み URL の永続化 (`Notified` クラス)。
- 設定ファイルは `data/config.json` (環境変数 `CONFIG_PATH` で変更可)、通知済み情報は `data/notified.json` (環境変数 `NOTIFIED_PATH` で変更可)。Docker では `/data` 配下を使う。
- 設定のスキーマは `schema/Configuration.json`。`Configuration` を変更したら `pnpm generate-schema` で再生成し、`README.md` も更新する。

## コーディング規約

- 命名は camelCase (関数・変数)、PascalCase (クラス・インターフェース)。
- インターフェースには日本語で JSDoc を記載する (関数への記載は推奨)。
- フォーマットは Prettier、Lint は ESLint に従う。
- ログ出力には `@book000/node-utils` の `Logger` を使う。
- スクレイピングは標準 `fetch` + `cheerio` を使う (`axios` は使用しない)。大規模スクレイピングフレームワークは導入しない。
- `skipLibCheck` によるエラー回避は行わない。
- テストは Jest (ts-jest)。パースなど壊れやすい箇所にはテストを書く (`src/quicpay-campaigns.test.ts` 参照。実サイトへアクセスする)。

## Git 運用

- ブランチ名は Conventional Branch (`feat/`, `fix/` など)、コミットメッセージは Conventional Commits に従う。
- Renovate が作成した PR には追加コミットや更新を行わない。

## 守るべき不変条件

- Discord の Webhook URL・Bot token などの認証情報をコミットしない。ログ・テスト・Issue / PR にも出力しない。
- スクレイピング結果が期待した DOM 構造でない場合は、握りつぶさずエラーを投げる (`src/quicpay-campaigns.ts`)。
- 通知済み判定はキャンペーン URL をキーにする。初回実行 (`data/notified.json` が存在しない) では通知せず記録のみ行い、大量通知を防ぐ。この挙動と通知済み管理を変更する場合は、再送や取りこぼしが起きないことを確認する。
- `src/config.ts` の型ガード内の `@typescript-eslint/no-unsafe-*` 無効化コメントは、外部入力の検証のため意図的なもの。
- 対象サイトの規約と負荷に配慮する (取得間隔は `entrypoint.sh` の 30 分)。
