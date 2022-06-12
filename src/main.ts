import * as core from '@actions/core'
import * as tags from './tags'
import * as update from './update'

async function run(): Promise<void> {
  try {
    const repo: string = core.getInput('repo')
    const pointer: string = core.getInput('pointerTag')
    const regex: string = core.getInput('regex')
    const maxTagsToFetch: number = parseInt(core.getInput('maxTagsToFetch'))

    const updateFile: string = core.getInput('updateFile')
    const pattern: string = core.getInput('pattern')
    const replace: string = core.getInput('replace')

    if (!!updateFile !== !!pattern || !!updateFile !== !!replace) {
      throw new Error('updateFile, pattern, and replace must be used together')
    }

    const dockerMatch = repo.match('^docker\\.io/(.+)')
    const quayMatch = repo.match('^quay\\.io/(.+)')
    let tagList
    let pointerTag
    if (dockerMatch) {
      tagList = await tags.dockerHubListTags(dockerMatch[1], maxTagsToFetch)
      pointerTag = await tags.dockerHubGetTag(dockerMatch[1], pointer)
    } else if (quayMatch) {
      tagList = await tags.quayIoListTags(quayMatch[1], maxTagsToFetch)
      pointerTag = await tags.quayIoGetTag(quayMatch[1], pointer)
    } else {
      throw new Error(`Unknown repository: ${repo}`)
    }
    const tag = await tags.getMatchingTag(tagList, pointerTag, regex)
    core.debug(`Found ${tag.toString()}`)
    core.setOutput('tag', tag.tag)

    if (updateFile) {
      const updated = update.updateFile(
        updateFile,
        pattern,
        replace.replace('${tag}', tag.tag)
      )
      core.setOutput('updated', updated)
    }
  } catch (error) {
    if (error instanceof Error) core.setFailed(error.message)
  }
}

run()
