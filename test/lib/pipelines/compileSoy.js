'use strict';

var assert = require('assert');
var compileSoy = require('../../../lib/pipelines/compileSoy');
var ignore = require('gulp-ignore');
var vfs = require('vinyl-fs');

describe('Compile Soy Pipeline', function() {
	it('should compile soy files to js', function(done) {
    var stream = vfs.src('test/fixtures/soy/simple.soy')
      .pipe(compileSoy());
    stream.on('data', function(file) {
      assert.strictEqual('simple.soy.js', file.relative);
  		done();
    });
	});

	it('should not throw error if no files are provided for compilation', function(done) {
    var stream = vfs.src('test/fixtures/soy/simple.soy')
			.pipe(ignore.exclude('*.soy'))
			.pipe(compileSoy());
		stream.on('end', function() {
			done();
		});
	});

	it('should set the "params" variable for each template, with a list of its param names', function(done) {
    var stream = vfs.src('test/fixtures/soy/simple.soy')
      .pipe(compileSoy());
    stream.on('data', function(file) {
      var contents = file.contents.toString();
      assert.notStrictEqual(-1, contents.indexOf('exports.render.params = [];'));
      assert.notStrictEqual(-1, contents.indexOf('exports.hello.params = ["firstName","lastName"];'));
  		done();
    });
	});

	it('should add lines to generated soy js file that import some metal ES6 modules', function(done) {
    var stream = vfs.src('test/fixtures/soy/simple.soy')
      .pipe(compileSoy());
    stream.on('data', function(file) {
      var contents = file.contents.toString();
			assert.notStrictEqual(-1, contents.indexOf('import Component from \'metal-component/src/Component\';'));
			assert.notStrictEqual(-1, contents.indexOf('import Soy from \'metal-soy/src/Soy\';'));
			done();
		});
	});

	it('should export the templates', function(done) {
    var stream = vfs.src('test/fixtures/soy/simple.soy')
      .pipe(compileSoy());
    stream.on('data', function(file) {
      var contents = file.contents.toString();
			assert.notStrictEqual(-1, contents.indexOf('templates = exports;'));
      assert.notStrictEqual(-1, contents.indexOf('export default templates;'));
			done();
		});
	});

	it('should automatically generate and export component class using SoyRenderer', function(done) {
    var stream = vfs.src('test/fixtures/soy/simple.soy')
      .pipe(compileSoy());
    stream.on('data', function(file) {
      var contents = file.contents.toString();
			assert.notStrictEqual(-1, contents.indexOf('class Simple extends Component'));
			assert.notStrictEqual(-1, contents.indexOf('Soy.register(Simple, templates);'));
      assert.notStrictEqual(-1, contents.indexOf('export { Simple, templates };'));
			done();
		});
	});

	it('should not generate imports and component class if skipMetalGeneration is true', function(done) {
		var stream = vfs.src('test/fixtures/soy/simple.soy')
			.pipe(compileSoy({
				skipMetalGeneration: true
			}));
		stream.on('data', function(file) {
			var contents = file.contents.toString();
			assert.strictEqual(-1, contents.indexOf('import'));
			assert.strictEqual(-1, contents.indexOf('extends Component'));
			assert.strictEqual(-1, contents.indexOf('export default'));
			assert.strictEqual(-1, contents.indexOf('export {'));
			done();
		});
	});

	it('should replace goog.require calls to other templates with Soy.getTemplate calls', function(done) {
    var stream = vfs.src(['test/fixtures/soy/external.soy', 'test/fixtures/soy/simple.soy'])
      .pipe(compileSoy());
		var files = [];
    stream.on('data', function(file) {
			files.push(file);
		});
		stream.on('end', function() {
			assert.strictEqual(2, files.length);
      assert.strictEqual('external.soy.js', files[0].relative);
			assert.strictEqual('simple.soy.js', files[1].relative);

			var contents = files[0].contents.toString();
			assert.strictEqual(-1, contents.indexOf('goog.require(\'Simple.incrementaldom\')'));
			assert.notStrictEqual(-1, contents.indexOf('Soy.getTemplate(\'Simple.incrementaldom\', \'render\')'));
			assert.notStrictEqual(-1, contents.indexOf('Soy.getTemplate(\'Simple.incrementaldom\', \'hello\')'));
  		done();
    });
	});

	it('should emit error and end stream when soy parsing error is thrown', function(done) {
    var stream = vfs.src('test/fixtures/soy/parseError.soy')
      .pipe(compileSoy());
		var error;
    stream.on('error', function(e) {
  		error = e;
    });
		stream.on('end', function() {
			assert.ok(error);
			done();
		});
	});

	it('should emit error and end stream when the soy jar compiler throws an error', function(done) {
    var stream = vfs.src('test/fixtures/soy/compileError.soy')
      .pipe(compileSoy());
		var error;
    stream.on('error', function(e) {
  		error = e;
    });
		stream.on('end', function() {
			assert.ok(error);
			done();
		});
	});
});
