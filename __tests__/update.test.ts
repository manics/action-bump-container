import Crypto from 'crypto'
import {readFileSync, writeFileSync} from 'fs'
import {tmpdir} from 'os'
import Path from 'path'

import * as update from '../src/update'
import * as utils from './utils'
import {afterEach, beforeEach, expect, jest, test} from '@jest/globals'

jest.retryTimes(0)

const valuesYml = utils.loadValuesYml()
let tmpFile: string

beforeEach(() => {
  tmpFile = utils.createTmpFile()
})

afterEach(() => {
  utils.deleteFile(tmpFile)
})

const tag_updates = [
  [
    '%TAG_OMEROWEB%',
    'docker\\.io\\/openmicroscopy\\/omero-web',
    '1.2.3',
    '2.0.0-1'
  ],
  ['%TAG_R2D%', 'quay\\.io\\/jupyterhub\\/repo2docker', '0.1.0', '1.2.3-2']
]

test.each(tag_updates)(
  'updateString %s',
  (placeholder, repo, oldtag, newtag) => {
    const input = valuesYml.replace(placeholder, oldtag)
    const expected = valuesYml.replace(placeholder, newtag)
    const updated = update.updateString(
      input,
      `(repository: ${repo}\\n\\s+tag:) (\\S+)`,
      `$1 ${newtag}`
    )
    expect(updated).toEqual(expected)
  }
)

test.each(tag_updates)('updateFile %s', (placeholder, repo, oldtag, newtag) => {
  const input = valuesYml.replace(placeholder, oldtag)
  const expected = valuesYml.replace(placeholder, newtag)
  console.debug(`Using tmpFile: ${tmpFile}`)

  writeFileSync(tmpFile, input, 'utf8')

  const updated1 = update.updateFile(
    tmpFile,
    `(repository: ${repo}\\n\\s+tag:) (\\S+)`,
    `$1 ${newtag}`
  )
  expect(updated1).toBe(true)

  const updatedContent = readFileSync(tmpFile, 'utf8')
  expect(updatedContent).toEqual(expected)

  const updated2 = update.updateFile(
    tmpFile,
    `(repository: ${repo}\\n\\s+tag:) (\\S+)`,
    `$1 ${newtag}`
  )
  expect(updated2).toBe(false)
})
