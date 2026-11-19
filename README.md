# watch-quicpay

[QUICPay のキャンペーン一覧ページ](https://www.quicpay.jp/campaign/)に追加された新しいキャンペーン情報を、Discord に通知する。

## インストール

Docker (Compose) または Node.js 環境で動作する。

### Docker (推奨)

`compose.yml` に以下を記述する。

```yaml
services:
  app:
    image: ghcr.io/tomacheese/watch-quicpay:latest
    volumes:
      - type: bind
        source: ./data
        target: /data/
    init: true
    restart: always
```

[設定](#設定)を参考に `data/config.json` を作成したあと、`docker compose up -d` で起動できる。30 分間隔で繰り返しキャンペーンを確認する。

### Node.js

Node.js ([.node-version](.node-version) 参照) と pnpm が必要。

```bash
pnpm install
pnpm start
```

[設定](#設定)を参考に `data/config.json` を作成してから実行する。

## 設定

既定では設定ファイル `data/config.json` を使う。環境変数 `CONFIG_PATH` を設定すると、その値を設定ファイルのパスとして使う。通知済みキャンペーンの記録先 (既定は `data/notified.json`) は環境変数 `NOTIFIED_PATH` で変更できる。

設定ファイルの JSON Schema は [schema/Configuration.json](schema/Configuration.json) を参照。通知先は Discord Webhook (`webhook_url`) または Bot (`token` と `channel_id`) のいずれかを指定する。

```json
{
  "$schema": "https://raw.githubusercontent.com/tomacheese/watch-quicpay/master/schema/Configuration.json",
  "discord": {
    "webhook_url": "https://discord.com/api/webhooks/..."
  }
}
```

初回実行時は通知せず、現在掲載中のキャンペーンを通知済みとして記録するだけとなる。

初回の一覧は全件をまとめて保存し、通常の通知済み情報の更新も一時ファイルからの原子的な置換で行う。実際の保存先の親ディレクトリには、一時ファイルの作成・置換ができる権限が必要となる。既存ファイルの権限ビットは置換後も維持する。保存先が既存ファイルへのシンボリックリンクの場合は、リンクを維持して参照先を置換する。参照先が存在しないシンボリックリンクはエラーとなる。保存完了前に処理が中断した場合、初回は次の実行でも通知せず一覧を記録し、通常実行では更新前の記録を維持する。通知済みファイルの JSON が破損している場合や文字列の配列でない場合はエラーで停止し、自動的に初期化しない。復旧時は保存内容を確認し、正常なバックアップなどから復元する。

## ライセンス

このプロジェクトのライセンスは [MIT License](LICENSE) である。
