import * as core from '@actions/core'
import axios from 'axios'

export interface DockerHubImage {
  architecture: string
  digest: string
  os: string
  status: string
  last_pushed: Date
  [x: string]: unknown
}

export interface DockerHubTag {
  images: DockerHubImage[]
  last_updated: Date
  name: string
  tag_status: string
  tag_last_pushed: Date
  [x: string]: unknown
}

export interface DockerHubTagList {
  count: number
  next: string
  previous?: string
  results: DockerHubTag[]
}

export interface QuayIoTag {
  name: string
  reversion: boolean
  start_ts: number
  manifest_digest: string
  is_manifest_list: boolean
  size: number
  last_modified: string
}

export interface QuayIoTagList {
  tags: QuayIoTag[]
  page: number
  has_additional: boolean
}

// function handle_axios_error(err: any): void {
//   if (err.response) {
//     core.error(err.response.statusText)
//     core.error(err.response.status)
//     throw new Error(`${err.response.status} ${err.response.statusText}`)
//   }
//   throw new Error(err)
// }

// axios.interceptors.response.use(r => r, handle_axios_error)

export async function dockerHubListTags(
  repo: string
): Promise<DockerHubTagList> {
  const url = `https://registry.hub.docker.com/v2/repositories/${repo}/tags/`
  core.debug(`Fetching ${url}`)
  const r = await axios.get(url)
  return r.data
}

export async function dockerHubGetTag(
  repo: string,
  tag: string
): Promise<DockerHubTag> {
  const url = `https://registry.hub.docker.com/v2/repositories/${repo}/tags/${tag}`
  core.debug(`Fetching ${url}`)
  const r = await axios.get(url)
  return r.data
}

export async function quayIoListTags(repo: string): Promise<QuayIoTagList> {
  const url = `https://quay.io/api/v1/repository/${repo}/tag/?onlyActiveTags=true`
  core.debug(`Fetching ${url}`)
  const r = await axios.get(url)
  return r.data
}

export async function quayIoGetTag(
  repo: string,
  tag: string
): Promise<QuayIoTag> {
  const url = `https://quay.io/api/v1/repository/${repo}/tag/?onlyActiveTags=true&specificTag=${tag}`
  core.debug(`Fetching ${url}`)
  const r = await axios.get(url)
  if (r.data.tags.length !== 1) {
    throw new Error(`Expected 1 tag, got ${r.data.tags.length}`)
  }
  return r.data.tags[0]
}
