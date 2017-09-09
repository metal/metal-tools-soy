# metal-soy-loader

Webpack loader that compiles soy templates using [metal-tools-soy](//github.com/metal/metal-tools-soy)

# Usage

Because the produced output uses Google's Incremental DOM, some aliases need to be added to
webpacks configuration:

```js
// Webpack config
module.exports = {
  alias: {
    'incremental-dom': resolve('node_modules/incremental-dom'),
    'metal-incremental-dom': resolve('node_modules/metal-incremental-dom'),
    'metal-soy-bundle': resolve('node_modules/metal-soy-bundle')
  }
}
```

After adding that configuration, you can use `metal-soy-loader` as a normal one:

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

`metal-soy-loader` produces JavaScript code, exporting all found templates, so you
can add more loaders like `babel-loader` to process the output.
