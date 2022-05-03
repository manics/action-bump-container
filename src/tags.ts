import * as core from '@actions/core'
import axios from 'axios'

export interface DockerHubImage {
  architecture: string
  digest: string
  os: string
  status: string
  last_pushed: string
  [x: string]: unknown
}

export interface DockerHubTag {
  images: DockerHubImage[]
  last_updated: string
  name: string
  tag_status: string
  tag_last_pushed: string
  [x: string]: unknown
}

export interface DockerHubTagList {
  count: number
  next?: string | null
  previous?: string | null
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

class TagDigest {
  tag: string
  digests: string[]

  constructor(tag: string, digests: string[]) {
    this.tag = tag
    this.digests = digests.sort((a, b) => a.localeCompare(b))
  }

  toString(): string {
    return `${this.tag}[${this.digests.join(',')}]`
  }
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

function getTagDigest(tag: DockerHubTag | QuayIoTag): TagDigest {
  if ('manifest_digest' in tag) {
    // quay.io
    return new TagDigest(tag.name, [tag.manifest_digest as string])
  } else if ('images' in tag) {
    // docker hub
    return new TagDigest(
      tag.name,
      tag.images.map(i => i.digest)
    )
  } else {
    throw new Error(`Unknown tag type: ${tag}`)
  }
}

function getTagDigests(tagList: DockerHubTagList | QuayIoTagList): TagDigest[] {
  let tagDigests: TagDigest[] = []
  if ('tags' in tagList) {
    // quay.io: jq '.tags[] | [.name, .manifest_digest]'
    tagDigests = tagList.tags.map(
      t => new TagDigest(t.name, [t.manifest_digest])
    )
  } else if ('results' in tagList) {
    // docker hub: jq '.results[] | [.name, .images[].digest]'
    tagDigests = tagList.results.map(e => {
      core.info(`${e.name} ${e.images[0].digest}`)
      const t = new TagDigest(
        e.name,
        e.images.map(i => i.digest)
      )
      return t
    })
    core.info(tagDigests.toString())
  } else {
    throw new Error(`Unknown tag list type: ${tagList}`)
  }
  return tagDigests
}
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function arraysEqual(a: any[], b: any[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

export async function getMatchingTag(
  tagList: DockerHubTagList | QuayIoTagList,
  pointer: DockerHubTag | QuayIoTag
): Promise<TagDigest> {
  const tagDigests = getTagDigests(tagList)
  core.info(tagDigests.toString())
  const pointerTagDigest = getTagDigest(pointer)
  core.info(pointerTagDigest.toString())

  let match: TagDigest | null = null
  for (const tagDigest of tagDigests) {
    if (tagDigest.tag === pointerTagDigest.tag) {
      continue
    }

    if (arraysEqual(pointerTagDigest.digests, tagDigest.digests)) {
      if (!match || match.tag.length < tagDigest.tag.length) {
        match = tagDigest
      }
    }
  }
  if (!match) {
    throw new Error(`No match found for ${pointerTagDigest}`)
  }
  return match
}
