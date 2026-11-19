import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'

jest.mock('./quicpay-campaigns', () => ({ getCampaigns: jest.fn() }))
jest.mock('./discord', () => ({ sendDiscordMessage: jest.fn() }))
jest.mock('./config', () => ({
  PATH: { notified: '' },
  loadConfig: jest.fn(() => ({ discord: {} })),
}))
jest.mock('@book000/node-utils', () => ({
  Logger: { configure: () => ({ info: jest.fn(), error: jest.fn() }) },
}))

describe('main notification flow', () => {
  let directory: string
  let notifiedPath: string
  let exit: jest.SpiedFunction<typeof process.exit>
  const campaigns = ['first', 'second'].map((name) => ({
    url: `https://example.com/${name}`,
    title: name,
    description: 'Campaign',
    start: '2026/01/01',
    end: '2026/12/31',
  }))

  beforeEach(() => {
    directory = fs.mkdtempSync(path.join(os.tmpdir(), 'watch-quicpay-main-'))
    notifiedPath = path.join(directory, 'notified.json')
    exit = jest.spyOn(process, 'exit').mockReturnValue(undefined as never)
  })

  afterEach(() => {
    jest.restoreAllMocks()
    fs.rmSync(directory, { recursive: true, force: true })
  })

  async function run(list = campaigns, fetchError?: Error, sendError?: Error) {
    jest.resetModules()
    const { PATH } = jest.requireMock<typeof import('./config')>('./config')
    const { getCampaigns } = jest.requireMock<
      typeof import('./quicpay-campaigns')
    >('./quicpay-campaigns')
    const { sendDiscordMessage } =
      jest.requireMock<typeof import('./discord')>('./discord')
    PATH.notified = notifiedPath
    const fetchMock = jest.mocked(getCampaigns)
    const sendMock = jest.mocked(sendDiscordMessage)
    if (fetchError) fetchMock.mockRejectedValue(fetchError)
    else fetchMock.mockResolvedValue(list)
    if (sendError) sendMock.mockRejectedValue(sendError)
    else sendMock.mockResolvedValue(undefined)
    jest.requireActual<typeof import('./main')>('./main')
    await new Promise(setImmediate)
    return sendMock
  }

  test('records all initial URLs once, then notifies only later new campaigns', async () => {
    const rename = jest.spyOn(fs, 'renameSync')
    expect(await run()).not.toHaveBeenCalled()
    expect(
      rename.mock.calls.filter(([, to]) => to === notifiedPath)
    ).toHaveLength(1)
    expect(JSON.parse(fs.readFileSync(notifiedPath, 'utf8'))).toEqual(
      campaigns.map((campaign) => campaign.url)
    )
    expect(await run()).not.toHaveBeenCalled()
    const added = { ...campaigns[0], url: 'https://example.com/new' }
    const sent = await run([...campaigns, added])
    expect(sent).toHaveBeenCalledTimes(1)
    expect(sent).toHaveBeenCalledWith(
      expect.anything(),
      '',
      expect.objectContaining({ url: added.url }),
      true
    )
    expect(JSON.parse(fs.readFileSync(notifiedPath, 'utf8'))).toEqual([
      ...campaigns.map((campaign) => campaign.url),
      added.url,
    ])
    expect(exit).not.toHaveBeenCalled()
  })

  test('records an empty initial list', async () => {
    expect(await run([])).not.toHaveBeenCalled()
    expect(fs.readFileSync(notifiedPath, 'utf8')).toBe('[]')
  })

  test('retries the full initial list without sending after persistence fails', async () => {
    const rename = jest.spyOn(fs, 'renameSync').mockImplementation(() => {
      throw new Error('Rename failed')
    })
    expect(await run()).not.toHaveBeenCalled()
    expect(exit).toHaveBeenCalledWith(1)
    expect(fs.existsSync(notifiedPath)).toBe(false)
    rename.mockRestore()
    expect(await run()).not.toHaveBeenCalled()
    expect(JSON.parse(fs.readFileSync(notifiedPath, 'utf8'))).toHaveLength(2)
  })

  test('does not initialize after a failed fetch', async () => {
    expect(
      await run(campaigns, new Error('Fetch failed'))
    ).not.toHaveBeenCalled()
    expect(fs.existsSync(notifiedPath)).toBe(false)
    expect(exit).toHaveBeenCalledWith(1)
  })

  test('does not send or overwrite a corrupt baseline even for an empty list', async () => {
    fs.writeFileSync(notifiedPath, '["truncated')
    expect(await run([])).not.toHaveBeenCalled()
    expect(fs.readFileSync(notifiedPath, 'utf8')).toBe('["truncated')
    expect(exit).toHaveBeenCalledWith(1)
  })

  test('persists only successful sends during a normal run', async () => {
    fs.writeFileSync(notifiedPath, '[]')
    expect(
      await run(campaigns, undefined, new Error('Send failed'))
    ).toHaveBeenCalledTimes(1)
    expect(fs.readFileSync(notifiedPath, 'utf8')).toBe('[]')
    expect(exit).toHaveBeenCalledWith(1)
  })
})
