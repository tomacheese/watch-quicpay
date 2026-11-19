import fs from 'node:fs'
import os from 'node:os'
import path from 'node:path'
import { spawnSync } from 'node:child_process'
import { PATH } from './config'
import { Notified } from './notified'

describe('Notified', () => {
  let directory: string
  const originalPath = PATH.notified
  const urls = ['https://example.com/first', 'https://example.com/second']

  beforeEach(() => {
    directory = fs.mkdtempSync(
      path.join(os.tmpdir(), 'watch-quicpay-notified-')
    )
    PATH.notified = path.join(directory, 'notified.json')
  })

  afterEach(() => {
    jest.restoreAllMocks()
    PATH.notified = originalPath
    fs.rmSync(directory, { recursive: true, force: true })
  })

  test('stores the complete initial baseline without exposing a partial list', () => {
    const referencePath = path.join(directory, 'default-mode')
    fs.writeFileSync(referencePath, '')
    const defaultMode = fs.statSync(referencePath).mode & 0o777
    fs.rmSync(referencePath)
    const rename = fs.renameSync.bind(fs)
    const replacement = jest
      .spyOn(fs, 'renameSync')
      .mockImplementation((from, to) => {
        expect(fs.existsSync(PATH.notified)).toBe(false)
        expect(JSON.parse(fs.readFileSync(from, 'utf8'))).toEqual(urls)
        rename(from, to)
      })

    expect(Notified.isFirst()).toBe(true)
    Notified.initialize(urls)

    expect(replacement).toHaveBeenCalledTimes(1)
    expect(Notified.isFirst()).toBe(false)
    expect(Notified.isNotified(urls[0])).toBe(true)
    expect(Notified.isNotified(urls[1])).toBe(true)
    expect(fs.statSync(PATH.notified).mode & 0o777).toBe(defaultMode)
    expect(fs.readdirSync(directory)).toEqual(['notified.json'])
  })

  test('records an empty initial baseline and refuses to overwrite it', () => {
    Notified.initialize([])
    expect(Notified.isFirst()).toBe(false)
    expect(fs.readFileSync(PATH.notified, 'utf8')).toBe('[]')
    expect(() => {
      Notified.initialize(urls)
    }).toThrow('already exists')
    expect(fs.readFileSync(PATH.notified, 'utf8')).toBe('[]')
  })

  test('keeps existing URLs when recording a successful notification', () => {
    fs.writeFileSync(PATH.notified, JSON.stringify([urls[0]]))
    Notified.addNotified(urls[1])
    expect(JSON.parse(fs.readFileSync(PATH.notified, 'utf8'))).toEqual(urls)
    expect(fs.readdirSync(directory)).toEqual(['notified.json'])
  })

  test.each([0o640, 0o664])(
    'preserves existing file permissions: %s',
    (mode) => {
      fs.writeFileSync(PATH.notified, JSON.stringify([urls[0]]))
      fs.chmodSync(PATH.notified, mode)
      Notified.addNotified(urls[1])
      expect(fs.statSync(PATH.notified).mode & 0o777).toBe(mode)
      expect(JSON.parse(fs.readFileSync(PATH.notified, 'utf8'))).toEqual(urls)
    }
  )

  test('atomically updates a symbolic link target and preserves the link', () => {
    const persistentDirectory = path.join(directory, 'persistent')
    fs.mkdirSync(persistentDirectory)
    const targetPath = path.join(persistentDirectory, 'notified.json')
    fs.writeFileSync(targetPath, JSON.stringify([urls[0]]))
    fs.symlinkSync(path.relative(directory, targetPath), PATH.notified)
    const rename = fs.renameSync.bind(fs)
    const replacement = jest
      .spyOn(fs, 'renameSync')
      .mockImplementation((from, to) => {
        expect(path.dirname(from.toString())).toBe(persistentDirectory)
        expect(to).toBe(targetPath)
        expect(JSON.parse(fs.readFileSync(targetPath, 'utf8'))).toEqual([
          urls[0],
        ])
        rename(from, to)
      })

    Notified.addNotified(urls[1])

    expect(replacement).toHaveBeenCalledTimes(1)
    expect(fs.lstatSync(PATH.notified).isSymbolicLink()).toBe(true)
    expect(JSON.parse(fs.readFileSync(targetPath, 'utf8'))).toEqual(urls)
    expect(Notified.isNotified(urls[1])).toBe(true)
    expect(fs.readdirSync(persistentDirectory)).toEqual(['notified.json'])
  })

  test('does not replace a dangling symbolic link during initialization', () => {
    fs.symlinkSync('missing.json', PATH.notified)
    expect(() => {
      Notified.initialize(urls)
    }).toThrow()
    expect(fs.lstatSync(PATH.notified).isSymbolicLink()).toBe(true)
    expect(fs.readlinkSync(PATH.notified)).toBe('missing.json')
    expect(fs.readdirSync(directory)).toEqual(['notified.json'])
  })

  test.each([false, true])(
    'preserves committed state after a partial write (existing: %s)',
    (existing) => {
      if (existing) fs.writeFileSync(PATH.notified, JSON.stringify([urls[0]]))
      const write = fs.writeFileSync.bind(fs)
      jest.spyOn(fs, 'writeFileSync').mockImplementation((file) => {
        write(file, '["partial')
        throw new Error('Interrupted write')
      })

      expect(() => {
        if (existing) Notified.addNotified(urls[1])
        else Notified.initialize(urls)
      }).toThrow('Interrupted write')
      if (existing) {
        expect(fs.readFileSync(PATH.notified, 'utf8')).toBe(
          JSON.stringify([urls[0]])
        )
      } else {
        expect(Notified.isFirst()).toBe(true)
      }
      expect(fs.readdirSync(directory)).toEqual(
        existing ? ['notified.json'] : []
      )
    }
  )

  test.each([false, true])(
    'preserves committed state after a failed rename (existing: %s)',
    (existing) => {
      if (existing) fs.writeFileSync(PATH.notified, JSON.stringify([urls[0]]))
      jest.spyOn(fs, 'renameSync').mockImplementation(() => {
        throw new Error('Rename failed')
      })

      expect(() => {
        if (existing) Notified.addNotified(urls[1])
        else Notified.initialize(urls)
      }).toThrow('Rename failed')
      if (existing) {
        expect(fs.readFileSync(PATH.notified, 'utf8')).toBe(
          JSON.stringify([urls[0]])
        )
      } else {
        expect(Notified.isFirst()).toBe(true)
      }
      expect(fs.readdirSync(directory)).toEqual(
        existing ? ['notified.json'] : []
      )
      jest.restoreAllMocks()
      if (existing) {
        return
      }

      Notified.initialize(urls)
      expect(JSON.parse(fs.readFileSync(PATH.notified, 'utf8'))).toEqual(urls)
    }
  )

  test('restarts the complete initial baseline after an abrupt process exit', () => {
    const result = spawnSync(
      process.execPath,
      [
        '--require',
        'tsx/cjs',
        '--eval',
        `
      const fs = require('node:fs')
      const { Notified } = require('./src/notified.ts')
      fs.renameSync = () => process.exit(23)
      Notified.initialize(${JSON.stringify(urls)})
    `,
      ],
      {
        cwd: process.cwd(),
        env: { ...process.env, NOTIFIED_PATH: PATH.notified },
        encoding: 'utf8',
      }
    )
    expect(result.status).toBe(23)
    expect(fs.readdirSync(directory)).toHaveLength(1)
    expect(Notified.isFirst()).toBe(true)
    Notified.initialize(urls)
    expect(JSON.parse(fs.readFileSync(PATH.notified, 'utf8'))).toEqual(urls)
  })

  test.each(['["truncated', '{}', 'null', '[1]', '["valid",null]'])(
    'rejects invalid state without changing it: %s',
    (content) => {
      fs.writeFileSync(PATH.notified, content)
      expect(() => Notified.isFirst()).toThrow()
      expect(() => Notified.isNotified(urls[0])).toThrow()
      expect(() => {
        Notified.addNotified(urls[0])
      }).toThrow()
      expect(() => {
        Notified.initialize(urls)
      }).toThrow()
      expect(fs.readFileSync(PATH.notified, 'utf8')).toBe(content)
      expect(fs.readdirSync(directory)).toEqual(['notified.json'])
    }
  )

  test('propagates read errors rather than treating them as a missing baseline', () => {
    jest.spyOn(fs, 'readFileSync').mockImplementation(() => {
      throw Object.assign(new Error('Access denied'), { code: 'EACCES' })
    })
    expect(() => Notified.isFirst()).toThrow('Access denied')
    expect(() => {
      Notified.initialize(urls)
    }).toThrow('Access denied')
    expect(fs.readdirSync(directory)).toEqual([])
  })
})
