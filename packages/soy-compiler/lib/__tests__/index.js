'use strict';

const del = require('del');
const fs = require('fs');
const metalToolsSoy = require('../../index');
const vfs = require('vinyl-fs');
const path = require('path');

describe('Metal Tools - Soy', function() {
	beforeAll(() => {
		process.chdir(path.resolve(__dirname, '../../'));
	});

	beforeEach(function() {
		const stream = {
			pipe: function() {
				return stream;
			},
			readable: true,
			resume: jest.fn()
		};
		jest.spyOn(vfs, 'src').mockImplementation(() => stream);
		jest.spyOn(vfs, 'dest');
	});

	afterEach(function() {
		restoreStream();
	});

	afterAll(() => {
		process.chdir(process.cwd());
	});

	it('should compile soy files from/to "src" folder by default', function() {
		metalToolsSoy();
		expect(vfs.src.mock.calls[0][0]).toBe('src/**/*.soy');
		expect(vfs.dest.mock.calls[0][0]).toBe('src');
	});

	it('should compile soy files to multiple "dest" folder', function() {
		metalToolsSoy({ dest: ['src1', 'src2'] });
		expect(vfs.dest.mock.calls[0][0]).toBe('src1');
		expect(vfs.dest.mock.calls[1][0]).toBe('src2');
	});

	it('should consume stream by default', function() {
		const stream = metalToolsSoy({
			src: 'test/fixtures/soy/simple.soy',
			dest: 'test/fixtures/soy'
		});
		expect(stream.resume).toHaveBeenCalledTimes(1);
	});

	it('should not consume stream if skipConsume is set to true', function() {
		const stream = metalToolsSoy({
			src: 'test/fixtures/soy/simple.soy',
			dest: 'test/fixtures/soy',
			skipConsume: true
		});
		expect(stream.resume).not.toHaveBeenCalled();
	});

	describe('Integration', function() {
		beforeEach(function(done) {
			deleteCompiledSoyFiles(done);
			restoreStream();
		});

		afterAll(function(done) {
			deleteCompiledSoyFiles(done);
		});

		it('should compile specified soy files to js', function(done) {
			const stream = metalToolsSoy({
				src: 'test/fixtures/soy/simple.soy',
				dest: 'test/fixtures/soy'
			});
			stream.on('end', function() {
				expect(
					fs.existsSync('test/fixtures/soy/simple.soy.js')
				).toBeTruthy();
				done();
			});
		});

		it('should compile specific soy files to js with source map', function(
			done
		) {
			const stream = metalToolsSoy({
				dest: 'test/fixtures/soy',
				sourceMaps: true,
				src: 'test/fixtures/soy/simple.soy'
			});
			stream.on('end', function() {
				expect(
					fs.existsSync('test/fixtures/soy/simple.soy.js')
				).toBeTruthy();
				expect(
					fs.existsSync('test/fixtures/soy/simple.soy.js.map')
				).toBeTruthy();
				done();
			});
		});

		it('should emit error and end stream when the soy jar compiler throws an error', function(
			done
		) {
			const stream = metalToolsSoy({
				src: 'test/fixtures/soy/compileError.soy',
				dest: 'test/fixtures/soy'
			});
			console.error = jest.fn();
			stream.on('end', function() {
				expect(console.error).toHaveBeenCalledTimes(1);
				done();
			});
		});

		it('should use custom handleError function', function(done) {
			metalToolsSoy({
				dest: 'test/fixtures/soy',
				handleError: function(err) {
					expect(err).toBeTruthy();
					expect(err.message).toBeTruthy();

					done();
				},
				src: 'test/fixtures/soy/compileError.soy'
			});
		});

		it.skip(
			'should emit end event when rendering large number of files',
			function(done) {
				const stream = metalToolsSoy({
					src: 'test/fixtures/soy/overflow/*.soy',
					dest: 'test/fixtures/soy/overflow'
				});
				stream.on('end', function() {
					for (let i = 0; i <= 80; i++) {
						expect(
							fs.existsSync(
								'test/fixtures/soy/overflow/Soy' + i + '.soy.js'
							)
						).toBeTruthy();
					}
					done();
				});
			},
			20000
		);
	});
});

function deleteCompiledSoyFiles(done) {
	del('test/fixtures/**/*.soy.js*').then(function() {
		done();
	});
}

function restoreStream() {
	if (vfs.src.mockRestore) {
		vfs.src.mockRestore();
	}
	if (vfs.dest.mockRestore) {
		vfs.dest.mockRestore();
	}
}
