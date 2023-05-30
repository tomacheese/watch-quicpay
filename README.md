# watch-quicpay

Notify new campaign information added to the [QUICPay campaign list page](https://www.quicpay.jp/campaign/) via Discord.

## Installation

Works in Node.js or Docker (Compose) environment.

### Docker (Recommended)

If you want to use Docker, write the following in `compose.yaml`:

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

After that, you can start it with `docker-compose up -d` after creating a configuration file with reference to [Configuration section](#configuration).

### Node.js

If you are running in a Node.js environment, Node.js v18 is recommended.

Download and extract `watch-quicpay_vX.Y.Z.zip` from the [release page](https://github.com/tomacheese/watch-quicpay/releases) in the latest release.  
After that, you can start it with `node index.js` after creating a configuration file with reference to [Configuration section](#configuration).

## Configuration

The configuration file `data/config.json` is used by default.  
If the environment variable `CONFIG_FILE` is set, the specified value is taken as the path to the configuration file.

See here for the JSON Schema of the configuration file: [schema/Configuration.json](schema/Configuration.json)

```json
{
  "$schema": "https://raw.githubusercontent.com/tomacheese/watch-quicpay/master/schema/Configuration.json"
}
```

## License

The license for this project is [MIT License](LICENSE).
