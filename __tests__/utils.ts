import Crypto from 'crypto'
import {readFileSync, unlinkSync} from 'fs'
import {tmpdir} from 'os'
import Path from 'path'

export function createTmpFile(): string {
  // https://stackoverflow.com/a/61312694
  return Path.join(
    tmpdir(),
    `action-bump-container.updateString.${Crypto.randomBytes(6)
      .readUIntLE(0, 6)
      .toString(36)}`
  )
}

export function deleteFile(path: string): void {
  try {
    unlinkSync(path)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (err: any) {
    if (!('code' in err) || err.code !== 'ENOENT') {
      throw err
    }
  }
}

export function loadValuesYml(): string {
  return readFileSync(Path.join(__dirname, 'values.test.yaml'), 'utf8')
}
