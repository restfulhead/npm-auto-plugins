/* eslint-disable @typescript-eslint/no-explicit-any */
import { Auto, IExtendedCommit, ILogger, IPlugin } from '@auto-it/core'
import { execSync } from 'child_process'
import * as path from 'path'

function shouldOmitCommit(currentDir: string, currentWorkspace: string, commit: IExtendedCommit, logger: ILogger): boolean {
  // auto adds the current path to the file paths reported from git, so we need to undo this
  const fixedFiles = commit.files.map((file) => path.relative(currentDir, file))

  const atLeastOneFileInCurrentDir = fixedFiles.find((file) => file.startsWith(currentWorkspace))
  if (!atLeastOneFileInCurrentDir) {
    logger.verbose.log(`All files are outside the current workspace directory ('${currentWorkspace}'). Omitting commit '${commit.hash}'.`)
    return true
  } else {
    if (commit.labels?.includes('skip-release') || commit.subject?.includes('[skip ci]')) {
      logger.verbose.log('Skipping commit because it is marked as skip-release of [skip-ci]:', commit.hash, commit.labels, commit.subject)
      return true
    }

    logger.verbose.log(`At least one file is in the current workspace ('${currentWorkspace}'). Including commit '${commit.hash}'.`)
    return false
  }
}

export default class FilterByWorkspacePathPlugin implements IPlugin {
  /** The name of the plugin */
  name = 'filter-by-workspace-path-plugin'

  apply(auto: Auto) {
    const currentDir = path.resolve('.')
    const npmResult = execSync('npm ls --omit=dev --depth 1 -json', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] })
    const workspaceDeps: any = JSON.parse(npmResult).dependencies
    const currentWorkspace = workspaceDeps[Object.keys(workspaceDeps)[0] as any].resolved.substring(11)

    auto.hooks.onCreateLogParse.tap(this.name, (logParse) => {
      logParse.hooks.omitCommit.tap(this.name, (commit) => {
        return shouldOmitCommit(currentDir, currentWorkspace, commit, auto.logger) === true ? true : undefined
      })
    })
  }
}
