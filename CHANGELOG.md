# Changelog
<!-- markdownlint-disable MD024 -->

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [1.2.0] - 2025-12-09

### Changed

- Completely rewrote the library to use modern versions of the required components and to be more modular. Because the API didn't significantly change, this didn't involve a major version release.
- Using Typescript.
- Improved taking full page screenshots.

### Added

- Added support for `webp` images with the `webp` configuration option and the `type` configuration option.
- Added support for the command line arguments to override the JSON configuration file arguments.
- Added support for processing multiple JSON configurations in one call. You can also use glob patterns to specify the JSON configuration files.
- Added `fullscreen` configuration option.
- Added `waitUntil` configuration option.
- Added `scrollDelay` configuration option.
- Added support for hiding elements.
- Added stealth plugin so that puppeteer isn’t blocked by bot blockers.
- Added adblocker plugin to block ads and cookie banners.
- Added more template options for the `name` option such as `path`, `domain`, date options, and more.

## [1.1.0] - 2019-07-19

### Changed

- Added support for overriding certain configuration values through the sizes values in the JSON configuration.
- Improved error handling when taking the screenshot.
- Adjusted the maximum delay from 10 seconds to 30 seconds.

### Fixed

- Fixed issue where the wrong name value was used to set the name format from the JSON configuration.
- Fixed issue where if the directory path where the images are saved was more than one level deep then it wouldn't create the full directory path.

## [1.0.0] - 2019-07-19

### Added

- Initial release.
