import * as path from 'path'
import Auto, { SEMVER } from '@auto-it/core'
import makeCommitFromMsg from '@auto-it/core/dist/__tests__/make-commit-from-msg'
import LogParse from '@auto-it/core/dist/log-parse'
import { makeHooks, makeLogParseHooks, makeReleaseHooks } from '@auto-it/core/dist/utils/make-hooks'
import createLog from '@auto-it/core/dist/utils/logger'
import Release from '@auto-it/core/dist/release'
import FilterByWorkspacePathPlugin from '../src'
import { ProjectFilteringPluginOptions } from '../src'

const setup = (plugin_options: ProjectFilteringPluginOptions) => {
  const plugin = new FilterByWorkspacePathPlugin(plugin_options)
  const hooks = makeHooks()
  const logger = createLog()
  const logParseHooks = makeLogParseHooks()
  const releaseHooks = makeReleaseHooks()

  plugin.apply({ hooks, logger } as Auto)
  hooks.onCreateLogParse.call({ hooks: logParseHooks } as LogParse)
  hooks.onCreateRelease.call({
    hooks: releaseHooks,
    getSemverBump: (from: string, to?: string): Promise<SEMVER> => Promise.resolve(SEMVER.patch),
  } as Release)

  return logParseHooks
}

describe('Test plugin omits commits when using NPM', () => {
  const hooks = setup({"npm":true})

  it('should not filter the commit single file', async () => {
    const commit = makeCommitFromMsg('foo', {
      pullRequest: { number: 1 },
      files: [path.resolve('.', 'src/index.ts')],
    })
    expect(await hooks.omitCommit.promise(commit)).toBeUndefined()
  })

  it('should filter the commit single file', async () => {
    const commit = makeCommitFromMsg('foo', { pullRequest: { number: 1 }, files: ['/outside'] })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })

  it('should not filter the commit multi file', async () => {
    const commit = makeCommitFromMsg('foo', {
      pullRequest: { number: 1 },
      files: [path.resolve('.', 'src/index.ts'), '/outside'],
    })
    expect(await hooks.omitCommit.promise(commit)).toBeUndefined()
  })

  it('should filter the commit single file', async () => {
    const commit = makeCommitFromMsg('foo', { pullRequest: { number: 1 }, files: ['/outside', '/anotheroutsider'] })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })

  it('should skip commit labeled as skip-release', async () => {
    const commit = makeCommitFromMsg('foo', {
      labels: ['skip-release'],
      pullRequest: { number: 1 },
      files: [path.resolve('.', 'src/index.ts')],
    })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })

  it('should skip commit marked as skip-ci', async () => {
    const commit = makeCommitFromMsg('foo [skip ci]', {
      pullRequest: { number: 1 },
      files: [path.resolve('.', 'src/index.ts')],
    })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })

  it('should not skip commit in a sub-directory with the same prefix', async () => {
    const commit = makeCommitFromMsg('foo', {
      pullRequest: { number: 1 },
      files: [path.resolve('.', 'sub-dir/src/index.ts')],
    })
    expect(await hooks.omitCommit.promise(commit)).toBeUndefined()
  })

  it('should skip commit in a sub-directory without same prefix', async () => {
    const commit = makeCommitFromMsg('foo', {
      pullRequest: { number: 1 },
      files: [path.resolve('..', 'sub-dir/src/index.ts')],
    })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })

  it('should skip commits without related pull request', async () => {
    const commit = makeCommitFromMsg('foo', {
      files: [path.resolve('.', 'src/index.ts')],
    })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })
})

describe('Test plugin omits commits without NPM', () => {
  const hooks = setup({"npm":false})

  it('should not filter the commit single file', async () => {
    const commit = makeCommitFromMsg('foo', {
      pullRequest: { number: 1 },
      files: [path.resolve('.', 'src/index.ts')],
    })
    expect(await hooks.omitCommit.promise(commit)).toBeUndefined()
  })

  it('should filter the commit single file', async () => {
    const commit = makeCommitFromMsg('foo', { pullRequest: { number: 1 }, files: ['/outside'] })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })

  it('should not filter the commit multi file', async () => {
    const commit = makeCommitFromMsg('foo', {
      pullRequest: { number: 1 },
      files: [path.resolve('.', 'src/index.ts'), '/outside'],
    })
    expect(await hooks.omitCommit.promise(commit)).toBeUndefined()
  })

  it('should filter the commit single file', async () => {
    const commit = makeCommitFromMsg('foo', { pullRequest: { number: 1 }, files: ['/outside', '/anotheroutsider'] })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })

  it('should skip commit labeled as skip-release', async () => {
    const commit = makeCommitFromMsg('foo', {
      labels: ['skip-release'],
      pullRequest: { number: 1 },
      files: [path.resolve('.', 'src/index.ts')],
    })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })

  it('should skip commit marked as skip-ci', async () => {
    const commit = makeCommitFromMsg('foo [skip ci]', {
      pullRequest: { number: 1 },
      files: [path.resolve('.', 'src/index.ts')],
    })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })

  it('should not skip commit in a sub-directory with the same prefix', async () => {
    const commit = makeCommitFromMsg('foo', {
      pullRequest: { number: 1 },
      files: [path.resolve('.', 'sub-dir/src/index.ts')],
    })
    expect(await hooks.omitCommit.promise(commit)).toBeUndefined()
  })

  it('should skip commit in a sub-directory without same prefix', async () => {
    const commit = makeCommitFromMsg('foo', {
      pullRequest: { number: 1 },
      files: [path.resolve('..', 'sub-dir/src/index.ts')],
    })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })

  it('should skip commits without related pull request', async () => {
    const commit = makeCommitFromMsg('foo', {
      files: [path.resolve('.', 'src/index.ts')],
    })
    expect(await hooks.omitCommit.promise(commit)).toBe(true)
  })
})
