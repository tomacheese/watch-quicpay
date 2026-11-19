import fs from 'node:fs'
import { randomUUID } from 'node:crypto'
import { PATH } from './config'

export class Notified {
  public static isFirst(): boolean {
    return Notified.read() === undefined
  }

  public static initialize(eventCodes: string[]): void {
    if (!Notified.isFirst()) {
      throw new Error('Notification baseline already exists')
    }
    Notified.save(eventCodes)
  }

  public static isNotified(eventCode: string): boolean {
    return Notified.read()?.includes(eventCode) ?? false
  }

  public static addNotified(eventCode: string): void {
    const json = Notified.read() ?? []
    json.push(eventCode)
    Notified.save(json)
  }

  private static read(): string[] | undefined {
    let content: string
    try {
      content = fs.readFileSync(PATH.notified, 'utf8')
    } catch (error) {
      if (
        typeof error === 'object' &&
        error !== null &&
        'code' in error &&
        error.code === 'ENOENT'
      ) {
        return undefined
      }
      throw error
    }
    const json: unknown = JSON.parse(content)
    if (
      Array.isArray(json) &&
      json.every(
        (eventCode: unknown): eventCode is string =>
          typeof eventCode === 'string'
      )
    ) {
      return json
    }
    throw new Error('Invalid notification baseline: expected an array of URLs')
  }

  private static save(eventCodes: string[]): void {
    const temporaryPath = `${PATH.notified}.${randomUUID()}.tmp`
    try {
      fs.writeFileSync(temporaryPath, JSON.stringify(eventCodes), {
        flag: 'wx',
        mode: 0o600,
      })
      fs.renameSync(temporaryPath, PATH.notified)
    } finally {
      fs.rmSync(temporaryPath, { force: true })
    }
  }
}
