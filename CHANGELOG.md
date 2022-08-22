# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](http://keepachangelog.com/en/1.0.0/)
and this project adheres to [Semantic Versioning](http://semver.org/spec/v2.0.0.html).

## [Unreleased]

> Placeholder for any unreleased features/changes

## [2.0.0]

### Changed

-   Upgraded all dependencies. This included some breaking changes in `openid-client`. Most notably, `/.well-known/oauth-authorization-server` is no longer supported as an OIDC issuer URL. When passing the `--oidc-issuer` option to `eks-auth-proxy` you should make sure to pass the `/.well-known/openid-configuration` URL. More details here: https://github.com/panva/node-openid-client/releases/tag/v5.0.0

## [1.9.0] 2022-05-27

### Added

-   --proxy-disable-csp-header option to disable the content security policy protection. This is required for compatibility with newer versions of the kubernetes dashboard. See https://github.com/kubernetes/dashboard/issues/7057

### Fixed

-   Upgraded various packages to the latest version based on dependabot PRs
