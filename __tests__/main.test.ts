import {afterEach, beforeEach, expect, jest, test} from '@jest/globals'
import {readFileSync, writeFileSync} from 'fs'
import * as process from 'process'
import * as child_process from 'child_process'
import * as path from 'path'
import * as utils from './utils'

jest.retryTimes(0)

let tmpFile: string

beforeEach(() => {
  tmpFile = utils.createTmpFile()
})

afterEach(() => {
  utils.deleteFile(tmpFile)
})

const containerRepos = [
  ['docker.io/openmicroscopy/omero-web', 'latest'],
  ['quay.io/jupyterhub/repo2docker', 'main']
]
const np = process.execPath
const ip = path.join(__dirname, '..', 'lib', 'main.js')

// shows how the runner will run a javascript action with env / stdout protocol
test.each(containerRepos)('run tags %s', (repo, pointer) => {
  process.env['INPUT_REPO'] = repo
  process.env['INPUT_POINTERTAG'] = pointer
  // process.env['INPUT_REGEX'] = '^\\d+\\.\\d+\\.\\d+$'
  process.env['INPUT_MAXTAGSTOFETCH'] = '10'

  const options: child_process.ExecFileSyncOptions = {
    env: process.env
  }

  let stdout

  // Use try-catch so that we can display errors if the child process fails
  try {
    stdout = child_process.execFileSync(np, [ip], options).toString()
  } catch (err) {
    const e = err as child_process.SpawnSyncReturns<Buffer>
    console.log(`status: ${e.status}`)
    console.error(`stdout: ${e.stdout.toString()}`)
    console.error(`stderr: ${e.stderr.toString()}`)
    throw e
  }
  console.log(stdout)
  const outputs = stdout
    .split('\n')
    .filter(line => line.startsWith('::set-output '))
  expect(outputs.length).toEqual(1)
  expect(
    outputs[0].match('^::set-output name=tag::\\d+\\.\\d+\\.\\d+(-\\S+)?$')
  ).toBeTruthy()
})

test.each([containerRepos[1]])('run update files %s', (repo, pointer) => {
  process.env['INPUT_REPO'] = repo
  process.env['INPUT_POINTERTAG'] = pointer
  // process.env['INPUT_REGEX'] = '^\\d+\\.\\d+\\.\\d+$'
  process.env['INPUT_MAXTAGSTOFETCH'] = '10'

  process.env['INPUT_UPDATEFILE'] = tmpFile
  process.env['INPUT_PATTERN'] =
    '(repository: quay\\.io\\/jupyterhub\\/repo2docker\\n\\s+tag:) (\\S+)'
  process.env['INPUT_REPLACE'] = '$1 ${tag}'

  const valuesYml = utils.loadValuesYml()
  const input = valuesYml.replace('%TAG_R2D%', '0.0.1')
  writeFileSync(tmpFile, input, 'utf8')
  console.debug(`Using tmpFile: ${tmpFile}`)

  const options: child_process.ExecFileSyncOptions = {
    env: process.env
  }

  let stdout

  // Use try-catch so that we can display errors if the child process fails
  try {
    stdout = child_process.execFileSync(np, [ip], options).toString()
  } catch (err) {
    const e = err as child_process.SpawnSyncReturns<Buffer>
    console.log(`status: ${e.status}`)
    console.error(`stdout: ${e.stdout.toString()}`)
    console.error(`stderr: ${e.stderr.toString()}`)
    throw e
  }
  console.log(stdout)
  const outputs = stdout
    .split('\n')
    .filter(line => line.startsWith('::set-output '))
  expect(outputs.length).toEqual(2)
  const m = outputs[0].match(
    '^::set-output name=tag::(\\d+\\.\\d+\\.\\d+(-\\S+)?)$'
  )
  expect(m).toBeTruthy()
  expect(m!.length).toBe(3)
  const tag = m![1]
  console.debug(`tag: ${tag}`)
  expect(tag.length).toBeGreaterThanOrEqual(5)

  expect(outputs[1]).toBe('::set-output name=updated::true')

  const expected = valuesYml.replace('%TAG_R2D%', tag)
  const updatedContent = readFileSync(tmpFile, 'utf8')
  expect(updatedContent).toEqual(expected)
  expect(
    updatedContent.includes(
      `r2d:\n  image:\n    repository: quay.io/jupyterhub/repo2docker\n    tag: ${tag}\n`
    )
  ).toBeTruthy()
})

test('incorrect input', () => {
  process.env['INPUT_REPO'] = 'ignored'
  process.env['INPUT_POINTERTAG'] = 'ignored'
  process.env['INPUT_MAXTAGSTOFETCH'] = '10'

  process.env['INPUT_UPDATEFILE'] = '10'
  process.env['INPUT_PATTERN'] = 'non-empty'
  process.env['INPUT_REPLACE'] = ''

  const options: child_process.ExecFileSyncOptions = {
    env: process.env
  }

  const expectedError =
    '::error::updateFile, pattern, and replace must be used together'

  expect.assertions(1)

  try {
    child_process.execFileSync(np, [ip], options).toString()
  } catch (err) {
    const e = err as child_process.SpawnSyncReturns<Buffer>
    expect(e.stdout.toString().trim()).toBe(expectedError)
  }
})
