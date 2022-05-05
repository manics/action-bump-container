import * as tags from '../src/tags'
import {expect, jest, test} from '@jest/globals'

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
  const r = await tags.dockerHubListTags(repo)
  expect(r.results.length).toBeGreaterThan(1)
})

test.each(quayIoRepos)('quayIoGetTag %s', async (repo, tag) => {
  const r = await tags.quayIoGetTag(repo, tag)
  expect(r.name).toEqual(tag)
})

test.each(quayIoRepos)('quayIoListTags %s', async (repo, tag) => {
  const r = await tags.quayIoListTags(repo)
  expect(r.tags.length).toBeGreaterThan(1)
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
  const r = await tags.getMatchingTag(quay_podman, quay_podman_v3.tags[0])
  expect(r.tag).toEqual('v3.4.7')
})

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
