import { loadConfig } from './config'
import { DiscordEmbed, sendDiscordMessage } from './discord'
import { getCampaigns } from './quicpay-campaigns'
import { Notified } from './notified'
import { Logger } from '@book000/node-utils'

async function main() {
  const logger = Logger.configure('main')
  const config = loadConfig()

  logger.info('📡 Fetching campaigns...')
  const campaigns = await getCampaigns()
  const isFirst = Notified.isFirst()
  const newCampaigns = campaigns.filter((campaign) => {
    return !Notified.isNotified(campaign.url)
  })
  logger.info(`📝 ${newCampaigns.length} new campaigns found.`)

  for (const campaignInfo of newCampaigns) {
    const { url, title, start, end, description } = campaignInfo
    logger.info(`📝 ${title} : ${description}`)
    logger.info(`📝 ${start} 〜 ${end}`)

    const embed: DiscordEmbed = {
      title,
      description,
      url,
      timestamp: new Date().toISOString(),
      color: 0xff_80_00,
      fields: [
        {
          name: '期間',
          value: `${start} 〜 ${end}`,
          inline: true,
        },
      ],
    }
    if (!isFirst) {
      await sendDiscordMessage(config, '', embed, true)
    }

    Notified.addNotified(url)
  }
}

;(async () => {
  const logger = Logger.configure('main')
  await main().catch((error: unknown) => {
    logger.error('❌ Error occurred:', error as Error)
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1)
  })
})()
