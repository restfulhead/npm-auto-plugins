# NPM Auto plugin - Filter by workspace path

A plugin for [Intuit's Auto package](https://github.com/intuit/auto) that filters out commits that only have files outside the current 
workspace directory. This can be helpful, for example in mono repositories using NPM workspaces, where you run `auto` on each sub package 
individually and would like to include only commits relevant to the sub-package.

## Setup

To start using this plugin, add it to your `.autorc` config, for example:

```json
{
  "plugins": [
    "@restfulhead/npm-auto-plugin-filter-by-workspace-path",
    "npm",
  ]
}
```

If you are using this for NPM workspaces/sub-packages, then add this configuration to each workspace. Then run `auto` from each workspace 
directory. Observe that commits with only files from directories outside the workspace directory are omitted.

However, carefully read the following caveats section.

## Caveats

* by default, `auto version` seems to set the version to `patch` instead of `noVersion` even if all commits were filtered out.
* this plugin also ommits commits that are either labeled with `skip-release` or have `[skip ci]` in their commit message.
* while the title in the GitHub release notes is correct, the version is missing in the `CHANGELOG.md` file for currently unknown reasons
* you cannot use the `shipit` and other commands, because for example, the version in each package should only contain the version number 
  (e.g. `v1.0.0`), but the tag and Github release must include the package name to avoid ambigious releases.
* To see how to setup a release process that takes all of this into account, take a look at the 
[release.yml GitHub action](../../.github/workflows/release.yml) in this repository.
