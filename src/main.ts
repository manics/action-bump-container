import * as core from '@actions/core'
// import { mainModule } from 'process'
import * as tags from './tags'

// async function run(): Promise<void> {
//   try {
//     const ms: string = core.getInput('milliseconds')
//     core.debug(`Waiting ${ms} milliseconds ...`) // debug is only output if you set the secret `ACTIONS_STEP_DEBUG` to true

//     core.debug(new Date().toTimeString())
//     await wait(parseInt(ms, 10))
//     core.debug(new Date().toTimeString())

//     core.setOutput('time', new Date().toTimeString())
//   } catch (error) {
//     if (error instanceof Error) core.setFailed(error.message)
//   }
// }

async function run(): Promise<void> {
  const dt = await tags.dockerHubGetTag('openmicroscopy/omero-server', 'latest')
  core.info(JSON.stringify(dt, null, 2))

  const qt = await tags.quayIoGetTag('jupyterhub/repo2docker', 'main')
  core.info(JSON.stringify(qt, null, 2))

  try {
    const xt = await tags.dockerHubListTags('openmicroscopy/omero-server/xxx')
    core.info(JSON.stringify(xt, null, 2))
  } catch (error) {
    if (error instanceof Error) {
      core.error(error.message)
      // core.setFailed(error.message)
    }
  }
}

run()
