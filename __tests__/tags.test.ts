import * as tags from '../src/tags'
import {expect, jest, test} from '@jest/globals'
import nock from 'nock'

jest.retryTimes(0)

const dockerHubRepos = [
  ['jupyterhub/jupyterhub', 'latest'],
  ['openmicroscopy/omero-server', 'latest']
]
const quayIoRepos = [
  ['containers/podman', 'v3'],
  ['jupyterhub/repo2docker', 'main']
]

test.each(dockerHubRepos)('dockerHubGetTag %s', async (repo, tag) => {
  const r = await tags.dockerHubGetTag(repo, tag)
  expect(r.name).toEqual(tag)
  expect(r.images.length).toBeGreaterThan(0)
})

test.each(dockerHubRepos)('dockerHubListTags %s', async (repo, tag) => {
  const r = await tags.dockerHubListTags(repo, 3)
  expect(r.length).toEqual(3)
})

test.each(quayIoRepos)('quayIoGetTag %s', async (repo, tag) => {
  const r = await tags.quayIoGetTag(repo, tag)
  expect(r.name).toEqual(tag)
})

test.each(quayIoRepos)('quayIoListTags %s', async (repo, tag) => {
  const r = await tags.quayIoListTags(repo, 3)
  expect(r.length).toEqual(3)
})

// Single arch
import * as quay_repo2docker from './quay.io-jupyterhub-repo2docker-tags.json'
import * as quay_repo2docker_main from './quay.io-jupyterhub-repo2docker-tags-main.json'

// Multi arch
import * as quay_podman from './quay.io-containers-podman-tags.json'
import * as quay_podman_v3 from './quay.io-containers-podman-tags-v3.json'

// Multi arch
import * as docker_jupyterhub from './registry.hub.docker.com-jupyterhub-jupyterhub-tags.json'
import * as docker_jupyterhub_latest from './registry.hub.docker.com-jupyterhub-jupyterhub-tags-latest.json'

// Single arch
import * as docker_omeroweb from './registry.hub.docker.com-openmicroscopy-omero-web-tags.json'
import * as docker_omeroweb_latest from './registry.hub.docker.com-openmicroscopy-omero-web-tags-latest.json'

test('getMatchingTag podman', async () => {
  const r = await tags.getMatchingTag(quay_podman.tags, quay_podman_v3.tags[0])
  expect(r.tag).toEqual('v3.4.7')
})

test('getMatchingTag repo2docker', async () => {
  const r = await tags.getMatchingTag(
    quay_repo2docker.tags,
    quay_repo2docker_main.tags[0]
  )
  expect(r.tag).toEqual('2022.02.0-19.g1d218af')
})

test('getMatchingTag jupyterhub', async () => {
  const r = await tags.getMatchingTag(
    docker_jupyterhub.results,
    docker_jupyterhub_latest
  )
  expect(r.tag).toEqual('2.2.2')
})

test('getMatchingTag omero-web', async () => {
  const r = await tags.getMatchingTag(
    docker_omeroweb.results,
    docker_omeroweb_latest
  )
  expect(r.tag).toEqual('5.14.0-1')
})

test('getMatchingTag omero-web regex', async () => {
  const r = await tags.getMatchingTag(
    docker_omeroweb.results,
    docker_omeroweb_latest,
    '^\\d+\\.\\d+\\.\\d+$'
  )
  expect(r.tag).toEqual('5.14.0')
})

test('getMatchingTag no match throws', async () => {
  await expect(async () => {
    await tags.getMatchingTag(
      docker_omeroweb.results,
      docker_omeroweb_latest,
      'no-match'
    )
  }).rejects.toThrow('No match found for ')
})

import * as docker_example_2 from './registry.hub.docker.com-mock-example-tags-2.json'
import * as docker_example from './registry.hub.docker.com-mock-example-tags.json'

test('dockerHubListTags pagination', async () => {
  const repo = 'mock/example'
  nock('https://registry.hub.docker.com')
    .get(`/v2/repositories/${repo}/tags/`)
    .reply(200, docker_example)
    .get(`/v2/repositories/${repo}/tags/?page=2`)
    .reply(200, docker_example_2)

  const r = await tags.dockerHubListTags(repo, 10)
  expect(r.length).toEqual(3)
  expect(r[0].name).toEqual('0.3.0')
  expect(r[1].name).toEqual('0.2.0')
  expect(r[2].name).toEqual('0.1.0')
})

import * as quay_example from './quay.io-mock-example-tags.json'
import * as quay_example_2 from './quay.io-mock-example-tags-2.json'

test('quayIoListTags pagination', async () => {
  const repo = 'mock/example'
  nock('https://quay.io')
    .get(`/api/v1/repository/${repo}/tag/?onlyActiveTags=true`)
    .reply(200, quay_example)
    .get(`/api/v1/repository/${repo}/tag/?onlyActiveTags=true&page=2`)
    .reply(200, quay_example_2)
  const r = await tags.quayIoListTags(repo, 10)
  expect(r.length).toEqual(3)
  expect(r[0].name).toEqual('0.3.0')
  expect(r[1].name).toEqual('0.2.0')
  expect(r[2].name).toEqual('0.1.0')
})
