# CLAUDE.md

## プロジェクト概要
- 目的: QUICPay 公式サイトのキャンペーン一覧を監視し、新規キャンペーンを Discord に通知する。
- 主な機能: キャンペーン一覧のスクレイピング、新規項目の判定、Discord への Embed 通知。
- 技術スタック: TypeScript / Node.js (tsx 実行) / pnpm。

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

## アーキテクチャと主要ファイル
- `src/main.ts`: エントリーポイント。取得・判定・通知の全体フロー制御。
- `src/quicpay-campaigns.ts`: キャンペーン情報のスクレイピングとパース。サイト構造変更時はここを更新する。
- `src/discord.ts`: Discord 通知 (Embed 送信)。
- `src/config.ts`: 設定の読み込みと型定義 (`Configuration`)、パス定義。
- `src/notified.ts`: 通知済み情報の永続化 (`Notified` クラス)。

## コーディング規約
- 会話・コメントは日本語、エラーメッセージは英語で記載する。
- 日本語と英数字の間には半角スペースを入れる。
- 命名は camelCase (関数・変数)、PascalCase (クラス・インターフェース)。
- インターフェースには日本語で JSDoc を記載する (関数への記載は今後の方針として推奨)。
- フォーマットは Prettier、Lint は ESLint に従う。
- 推奨: 軽量なスクレイピング (標準 `fetch` + `cheerio`)。
- 非推奨: TypeScript の `skipLibCheck` によるエラー回避、および大規模スクレイピングフレームワークの導入 (本プロジェクトには過剰)。

## テスト
- Jest (ts-jest) を使用する。
- スクレイピング結果のパースロジックなど、壊れやすい箇所には積極的にテストを書く。`src/quicpay-campaigns.test.ts` を参考にする。

## リポジトリ固有
- スクレイピング対象: `https://www.quicpay.jp/campaign/`。対象サイトの規約と負荷に配慮する。
- 通知先: Discord Webhook もしくは Bot (token + channel_id)。設定は `src/config.ts` の `Configuration` 参照。
- 設定ファイル: `data/config.json` (環境変数 `CONFIG_PATH` で変更可)。スキーマは `schema/Configuration.json`。
- 通知済み管理: `data/notified.json` (環境変数 `NOTIFIED_PATH` で変更可)。

## セキュリティ / 機密情報
- Discord の Webhook URL・Bot token などの認証情報をコミットしない。
- ログに機密情報を出力しない。

## ドキュメント更新
- 設定項目を変更した場合は `schema/Configuration.json` (`pnpm generate-schema`) と `README.md` を更新する。
- 主要ファイル構成やコマンドを変更した場合は本 CLAUDE.md を更新する。

## 環境・運用ルール
- ブランチ命名は Conventional Branch (`feat/`, `fix/` など) に従う。
- コミットメッセージは Conventional Commits に従い、説明は日本語とする。
- Renovate が作成した PR に対して追加コミットや更新を行わない。
- リポジトリ調査が必要な場合はテンポラリディレクトリにクローンして行う。

## 作業チェックリスト
- コミット前: Conventional Commits 準拠、機密情報の混入なし、`pnpm lint` と `pnpm test` が通ること。
- PR 前: 作成依頼があること、コンフリクトの恐れがないこと。
- PR 後: コンフリクトがないこと、PR 本文が最新状態を反映していること、`gh pr checks <PR> --watch` で CI を確認すること。
