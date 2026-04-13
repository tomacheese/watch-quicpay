// axios → fetch 移行

import * as cheerio from 'cheerio'

interface QuicpayCampaign {
  url: string
  title: string
  start: string
  end: string
  description: string
}

function checkAllNotUndefined(
  results: Partial<QuicpayCampaign>[]
): results is QuicpayCampaign[] {
  return results.every((result) => {
    return (
      result.url !== undefined &&
      result.title !== undefined &&
      result.start !== undefined &&
      result.end !== undefined &&
      result.description !== undefined
    )
  })
}

export async function getCampaigns(): Promise<QuicpayCampaign[]> {
  const res = await fetch('https://www.quicpay.jp/campaign/')
  if (!res.ok) throw new Error(`HTTP error: ${res.status}`)
  const arrayBuffer = await res.arrayBuffer()
  const buffer = Buffer.from(arrayBuffer)
  const $ = cheerio.load(buffer)
  const campaignItems = $('div#comCampaignList .campaign-item')
  if (campaignItems.length === 0) {
    throw new Error('campaign items not found')
  }

  const results: Partial<QuicpayCampaign>[] = []
  for (const campaignItem of campaignItems) {
    const campaign = $(campaignItem)
    // /campaign/2023/shopspecial_may.html
    const rawUrl = campaign.find('a').attr('href')
    const url = rawUrl?.startsWith('/')
      ? `https://www.quicpay.jp${rawUrl}`
      : rawUrl
    // QUICPayチャンス！あちこちトクトクキャンペーン2023春
    const title = campaign.find('.m-card-campaign-txt').text()
    // 2023/05/01 00:00
    const start = campaign.attr('data-campaign-start')
    // 2023/05/31 23:59
    const end = campaign.attr('data-campaign-end')
    // 対象店舗でQUICPayを使うともれなくもらえる！
    // <p class="m-txt" data-gap="sm">対象店舗でQUICPayを使うともれなくもらえる！</p>
    const description = campaign.find('.m-txt').eq(2).text() // 3番目のpタグ

    if (!url || !title || !start || !end || !description) {
      throw new Error('some campaign info is undefined')
    }

    results.push({
      url,
      title,
      start,
      end,
      description,
    })
  }

  if (!checkAllNotUndefined(results)) {
    throw new Error('some results are undefined')
  }

  return results
}
