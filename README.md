# ⚙️ Metal tools soy  &middot; [![Build Status](https://travis-ci.org/metal/metal-tools-soy.svg?branch=master)](https://travis-ci.org/metal/metal-tools-soy) [![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](https://github.com/metal/metal-tools-soy)

Metal tools soy follows the approach of a monorepo containing the main packages that has as principle to improve the experience of the developer who is developing with [Soy template (Closure Template)](https://developers.google.com/closure/templates/).

## Contributing

Feel free to open up problems or send pull requests. We will always be looking at these problems and we will be responding whenever possible.

> Before opening a issue make sure it exists.

### Good First Issues

If you want to contribute to this project and do not know where to start [good first issues](https://github.com/metal/metal-tools-soy/labels/good%20first%20issue) is a great place to start.

### Setup

1. Install NodeJS >= [v6.11.0](http://nodejs.org/dist/v6.11.0/), if you don't have it yet.

2. Install global dependencies:

  ```
  [sudo] npm install -g yarn
  ```

3. Install project dependencies:

  ```
  yarn install
  ```

4. Install dependencies for each package and link them together:

  ```
  npm run lerna
  ```

5. Build all packages

  ```
  npm run compile
  ```

6. Run tests:

  ```
  npm run test
  ```


## License

BSD License © Liferay, Inc.