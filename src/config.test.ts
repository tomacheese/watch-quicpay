import fs from 'node:fs'
import Ajv from 'ajv'
import { loadConfig } from './config'
import schema from '../schema/Configuration.json'

const validate = new Ajv().compile(schema)

const cases: [string, unknown, boolean][] = [
  ['webhook', { discord: { webhook_url: 'webhook' } }, true],
  ['bot', { discord: { token: 'token', channel_id: 'channel' } }, true],
  [
    'both',
    {
      discord: {
        webhook_url: 'webhook',
        token: 'token',
        channel_id: 'channel',
      },
    },
    true,
  ],
  [
    'webhook with empty optional bot fields',
    { discord: { webhook_url: 'webhook', token: '', channel_id: '' } },
    true,
  ],
  ['empty discord', { discord: {} }, false],
  ['token only', { discord: { token: 'token' } }, false],
  ['channel only', { discord: { channel_id: 'channel' } }, false],
  ['empty webhook', { discord: { webhook_url: '' } }, false],
  [
    'empty webhook with bot',
    { discord: { webhook_url: '', token: 'token', channel_id: 'channel' } },
    false,
  ],
  ['empty token', { discord: { token: '', channel_id: 'channel' } }, false],
  ['empty channel', { discord: { token: 'token', channel_id: '' } }, false],
  [
    'invalid optional field',
    { discord: { webhook_url: 'webhook', token: 1 } },
    false,
  ],
  ['null discord', { discord: null }, false],
  ['array discord', { discord: [] }, false],
  ['null config', null, false],
  ['array config', [], false],
]

describe.each(cases)('%s', (_name, config, expected) => {
  test('schema and runtime agree', () => {
    expect(validate(config)).toBe(expected)
    jest.spyOn(fs, 'existsSync').mockReturnValue(true)
    jest.spyOn(fs, 'readFileSync').mockReturnValue(JSON.stringify(config))
    if (expected) {
      expect(loadConfig()).toEqual(config)
    } else {
      expect(() => loadConfig()).toThrow('Invalid config')
    }
    jest.restoreAllMocks()
  })
})
