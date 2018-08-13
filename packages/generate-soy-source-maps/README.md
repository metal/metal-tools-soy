# Soy SourceMaps &middot; [![npm version](https://img.shields.io/npm/v/generate-soy-source-maps.svg?style=flat-square)](https://www.npmjs.com/package/generate-soy-source-maps) [![License MIT](https://img.shields.io/badge/license-MIT-blue.svg?style=flat-square)](https://github.com/matuzalemsteles/generate-soy-source-maps/blob/master/LICENSE.md) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/matuzalemsteles/generate-soy-source-maps)

Generates a source map for Closure template (Soy templates) based on the implementation [described here](https://docs.google.com/document/d/1U1RGAehQwRypUTovF1KRlpiOFze0b-_2gc6fAH0KY0k/edit?hl=en_US#). The parsed code is the compiled to incremental Dom that is [made here](https://github.com/metal/metal-tools-soy).

## Table of Contents

- [CLI](#cli)
  - [Install](#install)
  - [Usage](#usage)
  - [All CLI Options](#all-cli-options)
- [Roadmap](#roadmap)
- [Contributing](#contributing)
- [License](#license)

## CLI

### Install

Via NPM:
```
$ npm install --global generate-soy-source-maps
```

or via Yarn:
```
$ yarn add --global generate-soy-source-maps
```

### Usage

```
$ soy-sourcemaps
```

#### All CLI Options

```
  Usage
    $ soy-sourcemaps [options]

  Options
    --input      The path of the Soy file
    --output     The path to the final file
```

## Roadmap

Here's what's coming up for Soy Sourcemaps:

- ~~Typescript support~~
- ~~CLI: Generate sourcemaps for multiple files~~
- Integration with metal-tools-soy
- Parse HTML in soy files (with Sourcemaps for the generated)

## Contributing

Feel free to open up problems or send pull requests. We will always be looking at these problems and we will be responding whenever possible.

> Before opening a issue make sure it exists.

## License

[MIT License](LICENSE)