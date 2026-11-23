import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { sendDiscordMessage } from './discord'

jest.mock('./quicpay-campaigns', () => ({ getCampaigns: jest.fn() }))
jest.mock('./config', () => ({
  PATH: { notified: '' },
  loadConfig: jest.fn(() => ({
    discord: { webhook_url: 'https://example.com/webhook?wait=true' },
  })),
}))
jest.mock('@book000/node-utils', () => ({
  Logger: { configure: () => ({ info: jest.fn(), error: jest.fn() }) },
}))

const config = { discord: { webhook_url: 'https://example.com/webhook' } }

afterEach(() => jest.restoreAllMocks())

test('accepts a 204 webhook response', async () => {
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(null, { status: 204 }))
  await expect(sendDiscordMessage(config, 'test')).resolves.toBeUndefined()
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test.each([429, 400, 500])('rejects a %i webhook response', async (status) => {
  const fetchMock = jest
    .spyOn(globalThis, 'fetch')
    .mockResolvedValue(new Response(null, { status }))
  await expect(sendDiscordMessage(config, 'test')).rejects.toThrow(
    `Discord webhook failed (${status})`
  )
  expect(fetchMock).toHaveBeenCalledTimes(1)
})

test('records a campaign after a 200 webhook response', async () => {
  const directory = fs.mkdtempSync(path.join(os.tmpdir(), 'webhook-test-'))
  const notifiedPath = path.join(directory, 'notified.json')
  const campaign = {
    url: 'https://example.com/campaign',
    title: 'Campaign',
    description: 'Description',
    start: '2026/01/01',
    end: '2026/12/31',
  }
  try {
    fs.writeFileSync(notifiedPath, '[]')
    const { PATH } = jest.requireMock<typeof import('./config')>('./config')
    PATH.notified = notifiedPath
    const { getCampaigns } = jest.requireMock<
      typeof import('./quicpay-campaigns')
    >('./quicpay-campaigns')
    jest.mocked(getCampaigns).mockResolvedValue([campaign])
    const response = new Response('{"id":"123"}', { status: 200 })
    const fetchMock = jest
      .spyOn(globalThis, 'fetch')
      .mockResolvedValue(response)
    const exit = jest.spyOn(process, 'exit').mockReturnValue(undefined as never)
    jest.requireActual<typeof import('./main')>('./main')
    await new Promise(setImmediate)
    expect(fetchMock).toHaveBeenCalledTimes(1)
    expect(response.bodyUsed).toBe(true)
    expect(JSON.parse(fs.readFileSync(notifiedPath, 'utf8'))).toEqual([
      campaign.url,
    ])
    expect(exit).not.toHaveBeenCalled()
  } finally {
    fs.rmSync(directory, { recursive: true, force: true })
  }
})
