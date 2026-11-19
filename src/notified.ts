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
      if (Notified.isMissingFile(error)) {
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
    const targetPath = Notified.resolvePath()
    const mode = fs.statSync(targetPath, { throwIfNoEntry: false })?.mode
    const temporaryPath = `${targetPath}.${randomUUID()}.tmp`
    try {
      fs.writeFileSync(temporaryPath, JSON.stringify(eventCodes), {
        flag: 'wx',
      })
      if (mode !== undefined) fs.chmodSync(temporaryPath, mode)
      fs.renameSync(temporaryPath, targetPath)
    } finally {
      fs.rmSync(temporaryPath, { force: true })
    }
  }

  private static resolvePath(): string {
    let stats: fs.Stats
    try {
      stats = fs.lstatSync(PATH.notified)
    } catch (error) {
      if (Notified.isMissingFile(error)) return PATH.notified
      throw error
    }
    return stats.isSymbolicLink()
      ? fs.realpathSync(PATH.notified)
      : PATH.notified
  }

  private static isMissingFile(error: unknown): boolean {
    return (
      typeof error === 'object' &&
      error !== null &&
      'code' in error &&
      error.code === 'ENOENT'
    )
  }
}
