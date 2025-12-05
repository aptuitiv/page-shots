# Changelog
<!-- markdownlint-disable MD024 -->

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/), and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

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