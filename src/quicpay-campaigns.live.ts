import { getCampaigns } from './quicpay-campaigns'

jest.setTimeout(120_000)

test('fetches the live campaign list', async () => {
  await expect(getCampaigns()).resolves.not.toThrow()
})
