import { readFileSync } from 'node:fs'
import { getCampaigns } from './quicpay-campaigns'

const fixture = readFileSync('src/fixtures/campaigns.html', 'utf8')

function mockHtml(html: string): void {
  jest.spyOn(globalThis, 'fetch').mockResolvedValue(new Response(html))
}

afterEach(() => jest.restoreAllMocks())

test('extracts all campaign values and resolves URLs', async () => {
  mockHtml(fixture)
  await expect(getCampaigns()).resolves.toEqual([
    {
      url: 'https://www.quicpay.jp/campaign/relative.html',
      title: '相対 URL のキャンペーン',
      start: '2026/01/01 00:00',
      end: '2026/01/31 23:59',
      description: '最初の説明',
    },
    {
      url: 'https://example.com/campaign',
      title: '絶対 URL のキャンペーン',
      start: '2026/02/01 09:00',
      end: '2026/02/28 18:00',
      description: '次の説明',
    },
  ])
})

test.each([
  ['link', 'href="/campaign/relative.html"', ''],
  ['title', 'class="m-card-campaign-txt"', ''],
  ['empty title', '相対 URL のキャンペーン', ''],
  ['start', 'data-campaign-start="2026/01/01 00:00"', ''],
  ['end', 'data-campaign-end="2026/01/31 23:59"', ''],
  ['empty description', '最初の説明', ''],
  [
    'description element',
    '<p class="m-txt">最初の説明</p>\n    <p class="m-txt">別の説明</p>',
    '',
  ],
])('rejects a missing %s', async (_field, original, replacement) => {
  mockHtml(fixture.replace(original, () => replacement))
  await expect(getCampaigns()).rejects.toThrow(
    'some campaign info is undefined'
  )
})

test('rejects an empty campaign list', async () => {
  mockHtml('<div id="comCampaignList"></div>')
  await expect(getCampaigns()).rejects.toThrow('campaign items not found')
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
