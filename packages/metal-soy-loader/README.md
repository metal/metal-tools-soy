# metal-soy-loader

Webpack loader that compiles soy templates using [metal-tools-soy](//github.com/metal/metal-tools-soy)

## Usage

Check https://webpack.js.org/concepts/loaders/ for documentation on implementing
loaders.

```js
// Webpack config
module.exports = {
  module: {
    rules: [
      {
        test: /\.soy$/,
        loader: 'metal-soy-loader'
      }
    ]
  }
}
```

`metal-soy-loader` produces JavaScript code, exporting all found templates, so
you can add more loaders like `babel-loader` to process the output.
