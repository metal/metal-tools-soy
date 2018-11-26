'use strict';

const childProcess = require('child_process');
const compileSoy = require('../compileSoy');
const del = require('del');
const js = require('js-beautify').js_beautify;
const ignore = require('gulp-ignore');
const path = require('path');
const vfs = require('vinyl-fs');

const outputDir = path.join(__dirname, '../../tmp');
const RegexSourceMapping = /\/\/# sourceMappingURL=([A-Za-z0-9_.]+$)/g;

expect.addSnapshotSerializer({
	print(val, serialize, indent) {
		return js(val.contents.toString(), {
			indent_size: 2,
			unformatted: 'none',
			wrap_line_length: 0
		});
	},
	test(val) {
		return val && val.hasOwnProperty('_contents');
	}
});

describe('Compile Soy Pipeline', function() {
	beforeAll(() => {
		jest.setTimeout(15000);
		process.chdir(path.resolve(__dirname, '../../../'));
	});

	afterAll(function(done) {
		jest.setTimeout(5000);
		process.chdir(process.cwd());
		del(outputDir).then(function() {
			done();
		});
	});

	it('should compile soy files to js', function(done) {
		const stream = vfs
			.src('test/fixtures/soy/simple.soy')
			.pipe(compileSoy());
		stream.on('data', function(file) {
			expect(file.relative).toBe('simple.soy.js');
			expect(file).toMatchSnapshot();
			done();
		});
	});

	it('should compile soy files with CRLF line ending to js without errors', function(done) {
		const stream = vfs.src('test/fixtures/soy/crlf.soy').pipe(compileSoy());
		stream.on('data', function(file) {
			expect(file.relative).toBe('crlf.soy.js');
			expect(file).toMatchSnapshot();
			done();
		});
	});

	it('should compile soy files to js using custom outputDir', function(done) {
		const stream = vfs.src('test/fixtures/soy/simple.soy').pipe(
			compileSoy({
				outputDir: outputDir
			})
		);

		stream.on('data', function(file) {
			expect(file.relative).toBe('simple.soy.js');
			expect(file).toMatchSnapshot();
			done();
		});
	});

	it('should not throw error if no files are provided for compilation', function(done) {
		const stream = vfs
			.src('test/fixtures/soy/simple.soy')
			.pipe(ignore.exclude('*.soy'))
			.pipe(compileSoy());
		stream.on('end', function() {
			done();
		});
	});

	it('should set the "params" variable for each template, with a list of its param names', function(done) {
		const stream = vfs
			.src('test/fixtures/soy/simple.soy')
			.pipe(compileSoy());
		stream.on('data', function(file) {
			const contents = file.contents.toString();

			expect(contents.indexOf('exports.render.params = [];')).not.toBe(
				-1
			);

			expect(
				contents.indexOf(
					'exports.hello.params = ["firstName","lastName"];'
				)
			).not.toBe(-1);

			expect(file).toMatchSnapshot();
			done();
		});
	});

	it('should set the "types" variable for each template, with a list of its param types', function(done) {
		const stream = vfs
			.src('test/fixtures/soy/paramTypes.soy')
			.pipe(compileSoy());
		stream.on('data', function(file) {
			const contents = file.contents.toString();

			expect(
				contents.indexOf('exports.render.types = {"content":"html"};')
			).not.toBe(-1);

			expect(file).toMatchSnapshot();
			done();
		});
	});

	it('should add lines to generated soy js file that import some metal ES6 modules', function(done) {
		const stream = vfs
			.src('test/fixtures/soy/simple.soy')
			.pipe(compileSoy());
		stream.on('data', function(file) {
			const contents = file.contents.toString();

			expect(
				contents.indexOf(`import Component from 'metal-component';`)
			).not.toBe(-1);

			expect(contents.indexOf(`import Soy from 'metal-soy';`)).not.toBe(
				-1
			);

			expect(file).toMatchSnapshot();
			done();
		});
	});

	it('should export the templates', function(done) {
		const stream = vfs
			.src('test/fixtures/soy/simple.soy')
			.pipe(compileSoy());
		stream.on('data', function(file) {
			const contents = file.contents.toString();

			expect(contents.indexOf('templates = exports;')).not.toBe(-1);

			expect(contents.indexOf('export default templates;')).not.toBe(-1);

			expect(file).toMatchSnapshot();
			done();
		});
	});

	it('should not export delegated templates', function(done) {
		const stream = vfs
			.src('test/fixtures/soy/delTemplate.soy')
			.pipe(compileSoy());
		stream.on('data', function(file) {
			const contents = file.contents.toString();
			expect(contents.indexOf('exports.DelTemplate.Foo')).toBe(-1);
			expect(file).toMatchSnapshot();
			done();
		});
	});

	it('should automatically generate and export component class using SoyRenderer', function(done) {
		const stream = vfs
			.src('test/fixtures/soy/simple.soy')
			.pipe(compileSoy());
		stream.on('data', function(file) {
			const contents = file.contents.toString();

			expect(contents.indexOf('class Simple extends Component')).not.toBe(
				-1
			);

			expect(
				contents.indexOf('Soy.register(Simple, templates);')
			).not.toBe(-1);

			expect(contents.indexOf('export { Simple, templates };')).not.toBe(
				-1
			);

			expect(file).toMatchSnapshot();
			done();
		});
	});

	it('should build generated class name from the entire namespace', function(done) {
		const stream = vfs
			.src('test/fixtures/soy/CompoundName.soy')
			.pipe(compileSoy());
		stream.on('data', function(file) {
			const contents = file.contents.toString();

			expect(
				contents.indexOf('class CompoundName extends Component')
			).not.toBe(-1);

			expect(
				contents.indexOf('Soy.register(CompoundName, templates);')
			).not.toBe(-1);

			expect(
				contents.indexOf('export { CompoundName, templates };')
			).not.toBe(-1);

			expect(file).toMatchSnapshot();
			done();
		});
	});

	it('should accept extending compound namespaces', function(done) {
		const stream = vfs
			.src([
				'test/fixtures/soy/compound/compound.soy',
				'test/fixtures/soy/compound/tada.soy'
			])
			.pipe(compileSoy());

		const files = [];

		stream.on('data', function(file) {
			files.push(file);
		});

		stream.on('end', function() {
			expect(files[0].relative).toBe('compound.soy.js');

			expect(files[1].relative).toBe('tada.soy.js');

			const contents = files[0].contents.toString();

			expect(
				contents.indexOf(
					`goog.module('com.metaljs.soy.compound.incrementaldom');`
				)
			).not.toBe(-1);

			expect(
				contents.indexOf(
					`var $templateAlias1 = Soy.getTemplate('com.metaljs.soy.tada.incrementaldom', 'render');`
				)
			).not.toBe(-1);

			expect(contents).toMatchSnapshot();

			done();
		});
	});

	it('should not generate component class if no render template is declared', function(done) {
		const stream = vfs
			.src('test/fixtures/soy/noRender.soy')
			.pipe(compileSoy());
		stream.on('data', function(file) {
			const contents = file.contents.toString();
			expect(contents.indexOf('import')).not.toBe(-1);
			expect(contents.indexOf('extends Component')).toBe(-1);
			expect(contents.indexOf('export default')).not.toBe(-1);
			expect(contents.indexOf('export { templates }')).not.toBe(-1);
			expect(file).toMatchSnapshot();
			done();
		});
	});

	it('should not generate imports and component class if skipMetalGeneration is true', function(done) {
		const stream = vfs.src('test/fixtures/soy/simple.soy').pipe(
			compileSoy({
				skipMetalGeneration: true
			})
		);
		stream.on('data', function(file) {
			const contents = file.contents.toString();
			expect(contents.indexOf('import')).toBe(-1);
			expect(contents.indexOf('extends Component')).toBe(-1);
			expect(contents.indexOf('export default')).toBe(-1);
			expect(contents.indexOf('export {')).toBe(-1);
			expect(file).toMatchSnapshot();
			done();
		});
	});

	it('should add to the end of the generated file the path to the source map', function(done) {
		const stream = vfs.src('test/fixtures/soy/simple.soy').pipe(
			compileSoy({
				sourceMaps: true
			})
		);
		const files = [];
		stream.on('data', function(file) {
			files.push(file);
		});
		stream.on('end', function() {
			const contents = files[0].contents.toString();
			expect(RegexSourceMapping.test(contents)).toBeTruthy();
			expect(files[0]).toMatchSnapshot();
			done();
		});
	});

	it('should replace goog.require calls to other templates with Soy.getTemplate calls', function(done) {
		const stream = vfs
			.src([
				'test/fixtures/soy/external.soy',
				'test/fixtures/soy/simple.soy'
			])
			.pipe(compileSoy());
		const files = [];
		stream.on('data', function(file) {
			files.push(file);
		});
		stream.on('end', function() {
			expect(files.length).toBe(2);
			expect(files[0].relative).toBe('external.soy.js');
			expect(files[1].relative).toBe('simple.soy.js');

			const contents = files[0].contents.toString();

			expect(
				contents.indexOf(`goog.require('Simple.incrementaldom')`)
			).toBe(-1);

			expect(
				contents.indexOf(
					`Soy.getTemplate('Simple.incrementaldom', 'render')`
				)
			).not.toBe(-1);

			expect(
				contents.indexOf(
					`Soy.getTemplate('Simple.incrementaldom', 'hello')`
				)
			).not.toBe(-1);

			expect(files[0]).toMatchSnapshot();
			done();
		});
	});

	it('should not replace google external messages by default', function(done) {
		const stream = vfs
			.src('test/fixtures/soy/messages.soy')
			.pipe(compileSoy());
		stream.on('data', function(file) {
			const contents = file.contents.toString();

			expect(
				contents.match(/var MSG_EXTERNAL_(?:[^\s]*)\s=\sgoog.getMsg/g)
					.length
			).toBe(4);

			expect(file).toMatchSnapshot();
			done();
		});
	});

	it('should replace external messages from goog.getMsg calls if an externalMsgFormat has been specified', function(done) {
		const externalMsgFormat = `I18n.translate('$2')`;

		const stream = vfs.src('test/fixtures/soy/messages.soy').pipe(
			compileSoy({
				externalMsgFormat: externalMsgFormat
			})
		);
		stream.on('data', function(file) {
			const contents = file.contents.toString();

			expect(
				contents.match(
					/var MSG_EXTERNAL_(?:[^\s]*)\s=\sI18n.translate\('foo'\)/g
				).length
			).toBe(2);

			expect(
				contents.match(
					/var MSG_EXTERNAL_(?:[^\s]*)\s=\sI18n.translate\('bar'\)/g
				).length
			).toBe(1);

			expect(
				contents.match(
					/var MSG_EXTERNAL_(?:[^\s]*)\s=\sI18n.translate\('complex-key'\)/g
				).length
			).toBe(1);

			expect(file).toMatchSnapshot();
			done();
		});
	});

	it('should emit error and end stream when soy parsing error is thrown', function(done) {
		const stream = vfs
			.src('test/fixtures/soy/parseError.soy')
			.pipe(compileSoy());
		let error;
		stream.on('error', function(e) {
			error = e;
		});
		stream.on('end', function() {
			expect(error).toBeTruthy();
			done();
		});
	});

	it('should emit error and end stream when the soy jar compiler throws an error', function(done) {
		const stream = vfs
			.src('test/fixtures/soy/compileError.soy')
			.pipe(compileSoy());
		let error;
		stream.on('error', function(e) {
			error = e;
		});
		stream.on('end', function() {
			expect(error).toBeTruthy();
			done();
		});
	});

	it('should dedup soy deps when a relative path and absolute path point to the same soy file', function(done) {
		const soyDepPath = 'test/fixtures/soy/simple.soy';

		const stream = vfs.src('test/fixtures/soy/external.soy').pipe(
			compileSoy({
				soyDeps: [soyDepPath, path.join(process.cwd(), soyDepPath)]
			})
		);
		let error;
		stream.on('data', function(file) {
			expect(file.relative).toBe('external.soy.js');
			expect(file).toMatchSnapshot();
		});
		stream.on('error', function(e) {
			error = e;
		});
		stream.on('end', function() {
			expect(error).toBeFalsy();

			done();
		});
	});

	describe('Java Version', function() {
		const childProcessStub = {
			stderr: {
				on: jest.fn((a, cb) =>
					cb(
						'Exception in thread "main" java.lang.UnsupportedClassVersionError: '
					)
				)
			},
			on: jest.fn((a, cb) => cb(1))
		};

		beforeEach(function() {
			childProcess.spawn = jest.fn(() => childProcessStub);
		});

		afterEach(function() {
			childProcess.spawn.mockRestore();
		});

		it('should show better error message when the soy jar compiler throws an error due to java version', function(done) {
			const stream = vfs
				.src('test/fixtures/soy/simple.soy')
				.pipe(compileSoy());
			let error;
			stream.on('error', function(e) {
				error = e;
			});
			stream.on('end', function() {
				expect(error).toBeTruthy();

				const msg =
					'Make sure that you have Java version 8 or higher installed';
				expect(error.message.indexOf(msg)).not.toBe(-1);
				done();
			});
		});
	});
});
