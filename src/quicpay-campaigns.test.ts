import { getCampaigns } from './quicpay-campaigns'

jest.setTimeout(120_000) // 120sec

describe('QuickpayCampaigns', () => {
  test('getCampaigns', async () => {
    // await getCampaigns()
    // Error を投げないことを確認する
    await expect(getCampaigns()).resolves.not.toThrow()
  })
})
