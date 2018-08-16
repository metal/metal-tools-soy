# metal-tools-soy

[![Build Status](https://travis-ci.org/metal/metal-tools-soy.svg?branch=master)](https://travis-ci.org/metal/metal-tools-soy)

Tool that can be used to compile metal soy files.

## CLI

### Install

```sh
$ npm install --global metal-tools-soy
```

### Use

```sh
$ metalsoy
```

### Options

You can see information about the available options by typing `$ metalsoy --help` in the command line.

#### dest

```sh
$ metalsoy --dest folderName
```

The directory where the compiled files will be stored.

#### externalMsgFormat

```sh
$ metalsoy --externalMsgFormat format
```

Pattern that should be used to format the extracted external messages from compiled files.

#### help

```sh
$ metalsoy --help
```

Shows help information for all options, including default values.

#### outputDir

```sh
$ metalsoy --outputDir folderName
```

Temp directoy used to compile soy files.

Note: this option does not determine where the final `.soy.js` files are placed, see `--dest` option.

#### skipMetalGeneration

```sh
$ metalsoy --skipMetalGeneration
```

Passing this will cause soy files to be just compiled, without the addition of metal generated code (like the component class).

#### sourceMaps

```sh
$ metalsoy --sourceMaps
```

Passing this will cause source maps to be created for the soy files.

> The source map generator for soy files are in alpha, you can find problems. [Learn more here](https://github.com/matuzalemsteles/generate-soy-source-maps).

#### soyDeps

```sh
$ metalsoy --soyDeps node_modules/metal*/src/**/*.soy
```

Soy files that the main source files depend on, but that shouldn't be compiled. The soy compiler needs these files.

#### src

```sh
$ metalsoy --src src/**/*.soy
```

The path globs to the soy files to be compiled.

#### version

```sh
$ metalsoy --version
```

Displays current version of metal-tools-soy.

## SoyToIncrementalDomSrcCompiler

This project uses the `SoyToIncrementalDomSrcCompiler` to compile the soy files to metal using Incremental DOM. Since the compiler is not independently released, the process to update it in this project is as follows:

1. Clone the [https://github.com/google/closure-templates](google/closure-templates) repository
2. Update the `<version>` value inside `pom.xml` to the date of the latest commit that is going to get released using `yyyy-mm-dd` as the date format
3. Run `mvn install` on the root folder
4. Copy the generated file from `~/.m2/repository/com/google/template/soy/{version}/soy-{version}-SoyToIncrementalDomSrcCompiler.jar` to the `jar` folder in this project
