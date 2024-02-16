import Auto, { SEMVER } from '@auto-it/core'
import makeCommitFromMsg from '@auto-it/core/dist/__tests__/make-commit-from-msg'
import LogParse from '@auto-it/core/dist/log-parse'
import { makeChangelogHooks, makeHooks, makeLogParseHooks, makeReleaseHooks } from '@auto-it/core/dist/utils/make-hooks'
import FilterByPathPlugin from '../src'
import * as path from 'path'
import createLog from '@auto-it/core/dist/utils/logger'
import Release from '@auto-it/core/dist/release'
import Changelog from '@auto-it/core/dist/changelog'

const setup = () => {
  const plugin = new FilterByPathPlugin()
  const hooks = makeHooks()
  const logger = createLog()
  const logParseHooks = makeLogParseHooks()
  const releaseHooks = makeReleaseHooks()
  const changeLogHooks = makeChangelogHooks()

  plugin.apply({ hooks, logger } as Auto)
  hooks.onCreateLogParse.call({ hooks: logParseHooks } as LogParse)
  hooks.onCreateRelease.call({ hooks: releaseHooks } as Release)
  hooks.onCreateChangelog.call({ hooks: changeLogHooks } as Changelog, { bump: SEMVER.major })
  return logParseHooks
}

describe('Omit Commits Plugin', () => {
  it('should not filter the commit single file', async () => {
    const hooks = setup()
    const commit = makeCommitFromMsg('foo', { files: [path.resolve('.', 'packages/filter-by-workspace-path/src/index.ts')] })
    expect(await hooks.omitCommit.promise(commit)).toBeUndefined()
  })

  it('should filter the commit single file', async () => {
    const hooks = setup()
    const commit = makeCommitFromMsg('foo', { files: ['/outside'] })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })

  it('should not filter the commit multi file', async () => {
    const hooks = setup()
    const commit = makeCommitFromMsg('foo', { files: [path.resolve('.', 'packages/filter-by-workspace-path/src/index.ts'), '/outside'] })
    expect(await hooks.omitCommit.promise(commit)).toBeUndefined()
  })

  it('should filter the commit single file', async () => {
    const hooks = setup()
    const commit = makeCommitFromMsg('foo', { files: ['/outside', '/anotheroutsider'] })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })

  it('should skip commit labeled as skip-release', async () => {
    const hooks = setup()
    const commit = makeCommitFromMsg('foo', {
      labels: ['skip-release'],
      files: [path.resolve('.', 'packages/filter-by-workspace-path/src/index.ts')],
    })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })

  it('should skip commit marked as skip-ci', async () => {
    const hooks = setup()
    const commit = makeCommitFromMsg('foo [skip ci]', {
      files: [path.resolve('.', 'packages/filter-by-workspace-path/src/index.ts')],
    })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })

  it('should skip commit in a sub-directory with the same prefix', async () => {
    const hooks = setup()
    const commit = makeCommitFromMsg('foo', { files: [path.resolve('.', 'packages/filter-by-workspace-path-sub-dir/src/index.ts')] })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })
})
