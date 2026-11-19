import fs from 'node:fs'

export const PATH = {
  config: process.env.CONFIG_PATH ?? 'data/config.json',
  notified: process.env.NOTIFIED_PATH ?? 'data/notified.json',
}

/** @minLength 1 */
type NonEmptyString = string

export interface Configuration {
  /** Discord の通知先設定 (Webhook または Bot) */
  discord:
    | {
        /** 空でない Discord Webhook URL (Bot より優先) */
        webhook_url: NonEmptyString
        /** Webhook と併用する Discord Bot の token (任意) */
        token?: string
        /** Webhook と併用する Discord チャンネル ID (任意) */
        channel_id?: string
      }
    | {
        /** Discord Webhook URL (指定時は空文字列不可) */
        webhook_url?: NonEmptyString
        /** 空でない Discord Bot の token */
        token: NonEmptyString
        /** 空でない Discord チャンネル ID */
        channel_id: NonEmptyString
      }
}

const isConfig = (config: unknown): config is Configuration => {
  if (
    !config ||
    typeof config !== 'object' ||
    Array.isArray(config) ||
    !('discord' in config)
  ) {
    return false
  }
  const discord = config.discord
  if (!discord || typeof discord !== 'object' || Array.isArray(discord)) {
    return false
  }
  const { webhook_url, token, channel_id } = discord as Record<string, unknown>
  return (
    (webhook_url === undefined || typeof webhook_url === 'string') &&
    (token === undefined || typeof token === 'string') &&
    (channel_id === undefined || typeof channel_id === 'string') &&
    (webhook_url === undefined
      ? typeof token === 'string' &&
        token.length > 0 &&
        typeof channel_id === 'string' &&
        channel_id.length > 0
      : webhook_url.length > 0)
  )
}

export function loadConfig(): Configuration {
  if (!fs.existsSync(PATH.config)) {
    throw new Error('Config file not found')
  }
  const config = JSON.parse(fs.readFileSync(PATH.config, 'utf8'))
  if (!isConfig(config)) {
    throw new Error('Invalid config')
  }
  return config
}
