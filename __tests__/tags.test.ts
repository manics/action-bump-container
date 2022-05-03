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

import * as quay_repo2docker from './quay.io-jupyterhub-repo2docker-tags.json'
import * as quay_repo2docker_main from './quay.io-jupyterhub-repo2docker-tags-main.json'

import * as docker_jupyterhub from './registry.hub.docker.com-jupyterhub-jupyterhub-tags.json'
import * as docker_jupyterhub_latest from './registry.hub.docker.com-jupyterhub-jupyterhub-tags-latest.json'

import * as docker_omeroweb from './registry.hub.docker.com-openmicroscopy-omero-web-tags.json'
import * as docker_omeroweb_latest from './registry.hub.docker.com-openmicroscopy-omero-web-tags-latest.json'

test('getMatchingTag repo2docker', async () => {
  const r = await tags.getMatchingTag(
    quay_repo2docker,
    quay_repo2docker_main.tags[0]
  )
  expect(r.tag).toEqual('2022.02.0-19.g1d218af')
})

test('getMatchingTag jupyterhub', async () => {
  const r = await tags.getMatchingTag(
    docker_jupyterhub,
    docker_jupyterhub_latest
  )
  expect(r.tag).toEqual('2.2.2')
})

test('getMatchingTag omero-web', async () => {
  const r = await tags.getMatchingTag(docker_omeroweb, docker_omeroweb_latest)
  expect(r.tag).toEqual('5.14.0-1')
})
