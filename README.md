# NPM Auto plugins

A collection of plugins for [Intuit's auto package](https://github.com/intuit/auto).

## Plugins

* [filter-by-workspace-path](./packages/filter-by-workspace-path/README.md)

## Maintainer notes

### Release process

1. Create a new feature branch based on the `main` branch.
2. Periodically merge changes from the `main` branch into your feature branch
3. When ready, create a pull request and label it with an appropriate release label such as `release-patch`.
4. After code review, merge your pull request into the `main` branch.
5. When ready to release, create a pull request from `main` to `release`. *Important*: Label this PR with `skip-release`.
6. When the PR is merged, packages with changes will be automatically released.