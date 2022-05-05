import * as core from '@actions/core'
import * as tags from './tags'

async function run(): Promise<void> {
  try {
    const repo: string = core.getInput('repo')
    const pointer: string = core.getInput('pointerTag')
    const regex: string = core.getInput('regex')

    const dockerMatch = repo.match('^docker\\.io/(.+)')
    const quayMatch = repo.match('^quay\\.io/(.+)')
    let tagList
    let pointerTag
    if (dockerMatch) {
      tagList = await tags.dockerHubListTags(dockerMatch[1])
      pointerTag = await tags.dockerHubGetTag(dockerMatch[1], pointer)
    } else if (quayMatch) {
      tagList = await tags.quayIoListTags(quayMatch[1])
      pointerTag = await tags.quayIoGetTag(quayMatch[1], pointer)
    } else {
      throw new Error(`Unknown repository: ${repo}`)
    }
    const tag = tags.getMatchingTag(tagList, pointerTag, regex)
    core.setOutput('tag', tag)
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
