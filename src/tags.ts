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
  size: number | null
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function handle_axios_error(err: any): void {
  if (err.response) {
    core.error(err.response.statusText)
    core.error(err.response.status)
    throw new Error(`${err.response.status} ${err.response.statusText}`)
  }
  throw new Error(err)
}

axios.interceptors.response.use(r => r, handle_axios_error)

/**
 * List tags for a Docker Hub repository
 * @param repo The repository name in form owner/repo
 * @returns a list of Docker Hub tag objects
 */
export async function dockerHubListTags(
  repo: string,
  maxTags: number
): Promise<DockerHubTag[]> {
  const url = `https://registry.hub.docker.com/v2/repositories/${repo}/tags/`
  core.debug(`Fetching ${url}`)
  let r: {data: DockerHubTagList} = await axios.get(url)
  let results = r.data.results
  if (!maxTags) {
    return results
  }
  while (results.length < maxTags && r.data.next) {
    core.debug(`Fetching ${r.data.next}`)
    r = await axios.get(r.data.next)
    results = results.concat(r.data.results)
  }
  return results.slice(0, maxTags)
}

/**
 * Get a single tag for a Docker Hub repository
 * @param repo The repository name in form owner/repo
 * @returns The Docker registry tag object
 */
export async function dockerHubGetTag(
  repo: string,
  tag: string
): Promise<DockerHubTag> {
  const url = `https://registry.hub.docker.com/v2/repositories/${repo}/tags/${tag}`
  core.debug(`Fetching ${url}`)
  const r = await axios.get(url)
  return r.data
}

/**
 * List tags for a Quay.io repository
 * @param repo The repository name in form owner/repo
 * @returns a list of Quay.io tag objecss
 */
export async function quayIoListTags(
  repo: string,
  maxTags: number
): Promise<QuayIoTag[]> {
  const url = `https://quay.io/api/v1/repository/${repo}/tag/?onlyActiveTags=true`
  core.debug(`Fetching ${url}`)
  let r: {data: QuayIoTagList} = await axios.get(url)
  let tags = r.data.tags
  if (!maxTags) {
    return tags
  }
  while (r.data.tags.length < maxTags && r.data.has_additional) {
    const nextPage = `${url}&page=${r.data.page + 1}`
    core.debug(`Fetching ${nextPage}`)
    r = await axios.get(nextPage)
    tags = tags.concat(r.data.tags)
  }
  return tags.slice(0, maxTags)
}

/**
 * Get a single tag for a Quay.io repository
 * @param repo The repository name in form owner/repo
 * @returns The Quay.io tag object
 */
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

function getTagDigests(tags: DockerHubTag[] | QuayIoTag[]): TagDigest[] {
  let tagDigests: TagDigest[] = []
  if (!tags.length) {
    throw new Error('No tags')
  }
  if ('manifest_digest' in tags[0]) {
    // quay.io
    tagDigests = (tags as QuayIoTag[]).map(
      t => new TagDigest(t.name, [t.manifest_digest])
    )
  } else if ('images' in tags[0]) {
    // docker hub
    tagDigests = (tags as DockerHubTag[]).map(e => {
      const t = new TagDigest(
        e.name,
        e.images.map(i => i.digest)
      )
      return t
    })
  } else {
    throw new Error(`Unknown tag list type: ${tags}`)
  }
  return tagDigests
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function arraysEqual(a: any[], b: any[]): boolean {
  return a.length === b.length && a.every((value, index) => value === b[index])
}

/**
 * Dereference a container alias tag, e.g. latest -> v1.2.3
 * Matches are found by comparing the digest(s) of the alias tag and the digest(s) of the tags in the list. If a tag has multiple images (multi-arch) the full set of digests must match.
 * @param tagList List of tags/digests to consider
 * @param pointer Tag to be dereferenced
 * @param regex Regex to match against the tag name
 * @returns longest tag from tagList that matches pointer digest(s) and regex
 * @throws Error if no longer matching tag is found in tagList
 */
export async function getMatchingTag(
  tagList: DockerHubTag[] | QuayIoTag[],
  pointer: DockerHubTag | QuayIoTag,
  regex?: string
): Promise<TagDigest> {
  const tagDigests = getTagDigests(tagList)
  core.debug(`tag digests: ${tagDigests.toString()}`)
  const pointerTagDigest = getTagDigest(pointer)
  core.debug(`pointer tag digest: ${pointerTagDigest.toString()}`)

  let match: TagDigest | null = null
  for (const tagDigest of tagDigests) {
    if (tagDigest.tag === pointerTagDigest.tag) {
      continue
    }
    if (regex && !tagDigest.tag.match(regex)) {
      continue
    }
    if (!arraysEqual(pointerTagDigest.digests, tagDigest.digests)) {
      continue
    }
    if (!match || match.tag.length < tagDigest.tag.length) {
      match = tagDigest
    }
  }
  if (!match) {
    throw new Error(`No match found for ${pointerTagDigest}`)
  }
  return match
}
