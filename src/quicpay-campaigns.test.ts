import { getCampaigns } from './quicpay-campaigns'

jest.setTimeout(120_000) // 120sec

describe('QuickpayCampaigns', () => {
  test('getCampaigns', async () => {
    // Error を投げないことを確認する
    await expect(getCampaigns()).resolves.not.toThrow()
  })
})

describe('キャンペーンのパース', () => {
  const campaign = {
    url: '/campaign/example.html',
    title: 'キャンペーン',
    start: '2026/01/01 00:00',
    end: '2026/01/31 23:59',
    description: 'キャンペーンの説明',
  }

  function html(values: typeof campaign): string {
    return `<div id="comCampaignList"><div class="campaign-item" data-campaign-start="${values.start}" data-campaign-end="${values.end}">
      <a href="${values.url}"><span class="m-card-campaign-txt">${values.title}</span></a>
      <p class="m-txt">1</p><p class="m-txt">2</p><p class="m-txt">${values.description}</p>
    </div></div>`
  }

  afterEach(() => {
    jest.restoreAllMocks()
  })

  test('正常な項目を返す', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response(html(campaign)))
    await expect(getCampaigns()).resolves.toEqual([
      { ...campaign, url: `https://www.quicpay.jp${campaign.url}` },
    ])
  })

  test.each(Object.keys(campaign) as (keyof typeof campaign)[])(
    '%s が欠落するとエラーを投げる',
    async (key) => {
      jest
        .spyOn(globalThis, 'fetch')
        .mockResolvedValue(new Response(html({ ...campaign, [key]: '' })))
      await expect(getCampaigns()).rejects.toThrow(
        'some campaign info is undefined'
      )
    }
  )

  test('キャンペーン要素がない DOM ではエラーを投げる', async () => {
    jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(new Response('<html></html>'))
    await expect(getCampaigns()).rejects.toThrow('campaign items not found')
  })
})
