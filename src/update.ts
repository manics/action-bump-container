import {readFileSync, writeFileSync} from 'fs'

export function updateFile(
  path: string,
  pattern: string,
  replace: string
): boolean {
  const content = readFileSync(path, 'utf8')
  const updated = updateString(content, pattern, replace)
  if (updated === content) {
    return false
  }
  writeFileSync(path, updated, 'utf8')
  return true
}

export function updateString(
  s: string,
  pattern: string,
  replace: string
): string {
  const re = new RegExp(pattern)
  if (!s.search(re)) {
    throw new Error(`${pattern} not found`)
  }
  return s.replace(re, replace)
}
