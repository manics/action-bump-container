import {expect, test} from '@jest/globals'
import nock from 'nock'
import * as process from 'process'
import * as child_process from 'child_process'
import * as path from 'path'

test('throws 1 equals 1', async () => {
  expect(1).toEqual(1)
})

// shows how the runner will run a javascript action with env / stdout protocol
test.each([
  ['docker.io/openmicroscopy/omero-web', 'latest'],
  ['quay.io/jupyterhub/repo2docker', 'main']
])('run %s', (repo, pointer) => {
  process.env['INPUT_REPO'] = repo
  process.env['INPUT_POINTERTAG'] = pointer
  // process.env['INPUT_REGEX'] = '^\\d+\\.\\d+\\.\\d+$'
  process.env['INPUT_MAXTAGSTOFETCH'] = '10'

  const np = process.execPath
  const ip = path.join(__dirname, '..', 'lib', 'main.js')
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
