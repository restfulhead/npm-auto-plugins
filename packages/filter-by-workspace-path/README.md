# NPM Auto plugin - Filter by workspace path

A plugin for [Intuit's Auto package](https://github.com/intuit/auto) that filters out commits that only have files outside the current 
workspace directory. This can be helpful, for example in mono repositories using NPM workspaces, where you run `auto` on each sub package 
individually and would like to include only commits relevant to the sub-package.

## Setup

To start using this plugin, add it to your `.autorc` config, for example:

```json
{
  "plugins": [
    "@restfulhead/auto-plugin-filter-by-workspace-path",
    "npm",
  ]
}
```

Then, if your project uses NPM workspaces and you run e.g. `auto changelog` not from the root directory, but directly from a workspace
directory, then the changelog will only include pull requests that contain files inside the current workspace directory.

However, carefully read the following caveats section.

## Caveats

* Note that this plugin also ommits commits that
  * do not have a related pull request (e.g. pushed directly to the release branch)
  * belong to pull requests that has the `skip-release` label attached
  * have `[skip ci]` in their commit message
* By default, `auto version` seems to set the version to `patch` instead of `noVersion` even if all commits were filtered out.
  * Therefore, to detect if there were no changes in this case, you have to use the `auto changelog` command instead and then check whether
    a changelog was actually generated. :-/
* While the title in the GitHub release notes is correct, the version is missing in the `CHANGELOG.md` file for currently unknown reasons
* You can't use the `shipit` command, because for example, the version in each package should only contain the version number 
  (e.g. `v1.0.0`), but the tag and Github release must include the package name to avoid ambigious release names/tags.
  * However, you can use individual commands to make this work. To see how to setup a release process that takes all of this into account, 
    take a look at the [release.yml GitHub action](../../.github/workflows/release.yml) in this repository.
* If you create merge-commits against your release/target branch, then changes to files in your release/target branch become part of the 
  commit also. Those currently won't be filtered out. I'm not sure if there is a way to detect/filter out those files in a commit that 
  are caused by the merge while keeping the "actual" changed files. If so, this would be a good issue to fix. In the meantime, you can add 
  a label `skip-release` to the merge PR to exclude it completely. This on the other hand only works if you're working with a separate 
  release branch. For example:
  * Create a new pull request from you feature branch against your `main` branch. Label it e.g. with `release-minor`.
  * Merge the changes into `main`, but don't release from `main`.
  * Create another pull request to merge changes from `main` into your `release` branch. Label it with `skip-release`.
  * Merge this PR into your `release` branch and then run the release process from this branch.
