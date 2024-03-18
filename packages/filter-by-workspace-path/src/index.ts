import { execSync } from 'child_process'
import * as path from 'path'
import { Auto, IExtendedCommit, ILogger, IPlugin, SEMVER, inFolder } from '@auto-it/core'
import { inc, ReleaseType } from 'semver'

function shouldOmitCommit(currentDir: string, currentWorkspace: string, commit: IExtendedCommit, logger: ILogger): boolean {
  if (!commit.pullRequest) {
    return true
  }

  // auto adds the current path to the file paths reported from git, so we need to undo this
  const fixedFiles = commit.files.map((file) => path.relative(currentDir, file))
  const wsDir = path.join(currentWorkspace, path.sep)

  const atLeastOneFileInCurrentDir = fixedFiles.find((file) => inFolder(wsDir, file))

  if (!atLeastOneFileInCurrentDir) {
    logger.verbose.log(`All files are outside the current workspace directory ('${wsDir}'). Omitting commit '${commit.hash}'.`)
    return true
  } else {
    if (commit.labels?.includes('skip-release') || commit.subject?.includes('[skip ci]')) {
      logger.verbose.log('Skipping commit because it is marked as skip-release of [skip-ci]:', commit.hash, commit.labels, commit.subject)
      return true
    }

    logger.verbose.log(`At least one file is in the current workspace ('${wsDir}'). Including commit '${commit.hash}'.`)
    return false
  }
}

export interface ProjectFilteringPluginOptions {
  /** Path from the repo root to project we are filtering on */
  npm: boolean
}

export default class FilterByWorkspacePathPlugin implements IPlugin {
  /** The name of the plugin */
  name = 'filter-by-workspace-path-plugin'

  /** The options of the plugin */
  readonly options: ProjectFilteringPluginOptions

  /** Initialize the plugin with it's options */
  constructor(options: ProjectFilteringPluginOptions = { npm: true }) {
    this.options = options
  }

  apply(auto: Auto): void {
    const currentDir = path.resolve('.')
    let currentWorkspace = currentDir

    if (this.options.npm) {
      const npmResult = execSync('npm ls --omit=dev --depth 1 -json', { encoding: 'utf-8', stdio: ['pipe', 'pipe', 'ignore'] })
      const workspaceDeps: any = JSON.parse(npmResult).dependencies
      // eslint-disable-next-line @typescript-eslint/no-magic-numbers
      currentWorkspace = workspaceDeps[Object.keys(workspaceDeps)[0] as any].resolved.substring(11)
    }

    auto.hooks.onCreateLogParse.tap(this.name, (logParse) => {
      logParse.hooks.omitCommit.tap(this.name, (commit) =>
        shouldOmitCommit(currentDir, currentWorkspace, commit, auto.logger) ? true : undefined
      )
    })

    auto.hooks.onCreateRelease.tap(this.name, (release) => {
      const origGetVersion = release.getSemverBump.bind(release)
      release.getSemverBump = async (from: string, to?: string): Promise<SEMVER> => {
        const commits = await release.getCommits(from, to)
        if (commits.length === 0) {
          auto.logger.verbose.log('No commits found. Skipping release.')
          return SEMVER.noVersion
        }
        return origGetVersion(from, to)
      }

      release.calcNextVersion = async (lastTag: string) => {
        const bump = await release.getSemverBump(lastTag)
        const matches = lastTag.match(/(\d+\.\d+\.\d+)/)
        const lastVersion = matches ? matches[0] : lastTag

        return inc(lastVersion, bump as ReleaseType)
      }
    })
  }
}
