'use strict';

var assert = require('assert');
var childProcess = require('child_process');
var compileSoy = require('../../../lib/pipelines/compileSoy');
var del = require('del');
var ignore = require('gulp-ignore');
var path = require('path');
var sinon = require('sinon');
var vfs = require('vinyl-fs');

var outputDir = path.join(__dirname, '../../tmp');

describe('Compile Soy Pipeline', function() {
	after(function(done) {
		del(outputDir).then(function() {
			done();
		});
	});

	it('should compile soy files to js', function(done) {
    var stream = vfs.src('test/fixtures/soy/simple.soy')
      .pipe(compileSoy());
    stream.on('data', function(file) {
      assert.strictEqual('simple.soy.js', file.relative);
  		done();
    });
	});

	it('should compile soy files to js using custom outputDir', function(done) {
		var stream = vfs.src('test/fixtures/soy/simple.soy')
			.pipe(compileSoy({
				outputDir: outputDir
			}));

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

	it('should set the "types" variable for each template, with a list of its param types', function(done) {
    var stream = vfs.src('test/fixtures/soy/paramTypes.soy')
      .pipe(compileSoy());
    stream.on('data', function(file) {
      var contents = file.contents.toString();
      assert.notStrictEqual(-1, contents.indexOf('exports.render.types = {"content":"html"};'));
  		done();
    });
	});

	it('should add lines to generated soy js file that import some metal ES6 modules', function(done) {
    var stream = vfs.src('test/fixtures/soy/simple.soy')
      .pipe(compileSoy());
    stream.on('data', function(file) {
      var contents = file.contents.toString();
			assert.notStrictEqual(-1, contents.indexOf('import Component from \'metal-component\';'));
			assert.notStrictEqual(-1, contents.indexOf('import Soy from \'metal-soy\';'));
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

	it('should build generated class name from the entire namespace', function(done) {
    var stream = vfs.src('test/fixtures/soy/CompoundName.soy')
      .pipe(compileSoy());
    stream.on('data', function(file) {
      var contents = file.contents.toString();
			assert.notStrictEqual(-1, contents.indexOf('class CompoundName extends Component'));
			assert.notStrictEqual(-1, contents.indexOf('Soy.register(CompoundName, templates);'));
      assert.notStrictEqual(-1, contents.indexOf('export { CompoundName, templates };'));
			done();
		});
	});

	it('should not generate component class if no render template is declared', function(done) {
		var stream = vfs.src('test/fixtures/soy/noRender.soy')
			.pipe(compileSoy());
		stream.on('data', function(file) {
			var contents = file.contents.toString();
			assert.notStrictEqual(-1, contents.indexOf('import'));
			assert.strictEqual(-1, contents.indexOf('extends Component'));
			assert.notStrictEqual(-1, contents.indexOf('export default'));
			assert.notStrictEqual(-1, contents.indexOf('export { templates }'));
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

	describe('Java Version', function() {
		var childProcessStub = {
			stderr: {
				on: sinon.stub().yields('Exception in thread "main" java.lang.UnsupportedClassVersionError: ')
			},
			on: sinon.stub().yields(1)
		};

		beforeEach(function() {
			sinon.stub(childProcess, 'spawn').returns(childProcessStub);
		});

		afterEach(function() {
			childProcess.spawn.restore();
		});

		it('should show better error message when the soy jar compiler throws an error due to java version', function(done) {
			var stream = vfs.src('test/fixtures/soy/simple.soy')
				.pipe(compileSoy());
			var error;
			stream.on('error', function(e) {
				error = e;
			});
			stream.on('end', function() {
				assert.ok(error);

				var msg = 'Make sure that you have Java version 8 or higher installed';
				assert.notStrictEqual(-1, error.message.indexOf(msg));
				done();
			});
		});
	});
});
