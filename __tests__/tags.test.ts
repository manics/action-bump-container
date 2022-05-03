import * as tags from '../src/tags'
import {expect, jest, test} from '@jest/globals'

jest.retryTimes(0)

test('dockerHubGetTag', async () => {
  const r = await tags.dockerHubGetTag('openmicroscopy/omero-server', 'latest')
  expect(r.name).toEqual('latest')
  expect(r.images.length).toBeGreaterThan(0)
})

test('dockerHubListTags', async () => {
  const r = await tags.dockerHubListTags('openmicroscopy/omero-server')
  expect(r.results.length).toBeGreaterThan(1)
})

test('quayIoGetTag', async () => {
  const r = await tags.quayIoGetTag('jupyterhub/repo2docker', 'main')
  expect(r.name).toEqual('main')
})

test('quayIoListTags', async () => {
  const r = await tags.quayIoListTags('jupyterhub/repo2docker')
  expect(r.tags.length).toBeGreaterThan(1)
})
