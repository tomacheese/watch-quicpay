import { loadConfig } from './config'
import { DiscordEmbed, sendDiscordMessage } from './discord'
import { getCampaigns } from './quicpay-campaigns'
import { Notified } from './notified'

async function main() {
  const config = loadConfig()

  console.log('📡 Fetching campaigns...')
  const campaigns = await getCampaigns()
  const isFirst = Notified.isFirst()
  const newCampaigns = campaigns.filter((campaign) => {
    return !Notified.isNotified(campaign.url)
  })
  console.log(`📝 ${newCampaigns.length} new campaigns found.`)

  for (const campaignInfo of newCampaigns) {
    const { url, title, start, end, description } = campaignInfo
    console.log(`📝 ${title} : ${description}`)
    console.log(`📝 ${start} 〜 ${end}`)

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
      await sendDiscordMessage(config, '', embed)
    }

    Notified.addNotified(url)
  }
}

;(async () => {
  await main().catch((error) => {
    console.error(error)
    // eslint-disable-next-line unicorn/no-process-exit
    process.exit(1)
  })
})()
