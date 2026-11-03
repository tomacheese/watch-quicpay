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

## ライセンス

このプロジェクトのライセンスは [MIT License](LICENSE) である。
