import { createServer, Server } from 'node:http'
import { AddressInfo } from 'node:net'
import { sendDiscordMessage } from './discord'
import { getCampaigns } from './quicpay-campaigns'

const bot = { discord: { token: 'test', channel_id: '123' } }
const webhook = { discord: { webhook_url: 'https://example.com/webhook' } }

describe('request deadlines', () => {
  let server: Server
  let url: string
  let requests: number
  const originalFetch = fetch
  const originalTimeout = AbortSignal.timeout.bind(AbortSignal)
  let timeoutSpy: jest.SpiedFunction<typeof AbortSignal.timeout>

  beforeEach(async () => {
    server = createServer()
    requests = 0
    server.on('request', () => {
      requests++
    })
    await new Promise<void>((resolve) => server.listen(0, '127.0.0.1', resolve))
    url = `http://127.0.0.1:${(server.address() as AddressInfo).port}`
    timeoutSpy = jest.spyOn(AbortSignal, 'timeout').mockImplementation(() => {
      return originalTimeout(500)
    })
    jest
      .spyOn(globalThis, 'fetch')
      .mockImplementation((_input, init) => originalFetch(url, init))
  })

  afterEach(async () => {
    jest.restoreAllMocks()
    server.closeAllConnections()
    await new Promise<void>((resolve, reject) =>
      server.close((error) => {
        if (error) reject(error)
        else resolve()
      })
    )
  })

  test('aborts campaign response body reads', async () => {
    server.on('request', (_request, response) => {
      response.writeHead(200)
      response.write('partial')
    })
    await expect(getCampaigns()).rejects.toThrow()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(timeoutSpy).toHaveBeenCalledWith(30_000)
    expect(requests).toBe(1)
  })

  test('aborts a webhook waiting for headers without retrying', async () => {
    server.on('request', (request) => {
      request.resume()
    })
    await expect(sendDiscordMessage(webhook, 'test')).rejects.toThrow()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(timeoutSpy).toHaveBeenCalledWith(30_000)
    expect(requests).toBe(1)
  })

  test('aborts bot response body reads without retrying', async () => {
    server.on('request', (_request, response) => {
      response.writeHead(200, { 'Content-Type': 'application/json' })
      response.write('{"id":')
    })
    await expect(sendDiscordMessage(bot, 'test')).rejects.toThrow()
    expect(fetch).toHaveBeenCalledTimes(1)
    expect(timeoutSpy).toHaveBeenCalledWith(30_000)
    expect(requests).toBe(1)
  })

  test('ignores crosspost timeout after a successful bot message', async () => {
    let handled = 0
    server.on('request', (_request, response) => {
      handled++
      if (handled !== 1) {
        return
      }

      response.writeHead(200, { 'Content-Type': 'application/json' })
      response.end('{"id":"123"}')
    })
    await expect(
      sendDiscordMessage(bot, 'test', undefined, true)
    ).resolves.toBeUndefined()
    expect(fetch).toHaveBeenCalledTimes(2)
    expect(timeoutSpy).toHaveBeenCalledTimes(2)
    expect(timeoutSpy).toHaveBeenNthCalledWith(1, 30_000)
    expect(timeoutSpy).toHaveBeenNthCalledWith(2, 30_000)
    expect(requests).toBe(2)
  })
})
