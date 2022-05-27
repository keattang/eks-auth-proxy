# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

> Placeholder for any unreleased features/changes

## [1.9.0] 2022-05-27

### Added

- --proxy-disable-csp-header option to disable the content security policy protection. This is required for compatibility with newer versions of the kubernetes dashboard. See https://github.com/kubernetes/dashboard/issues/7057

### Fixed

- Upgraded various packages to the latest version based on dependabot PRs