'use strict';

const compileSoy = require('./lib/pipelines/compileSoy');
const consume = require('stream-consume');
const defaultOptions = require('./lib/options');
const gutil = require('gulp-util');
const merge = require('merge');
const vfs = require('vinyl-fs');

module.exports = function(options) {
	options = merge(
		{
			handleError: handleError
		},
		defaultOptions,
		options
	);

	if (!Array.isArray(options.dest)) {
		options.dest = [options.dest];
	}

	let stream = vfs
		.src(options.src)
		.pipe(compileSoy(options).on('error', options.handleError));

	options.dest.forEach(dest => (stream = stream.pipe(vfs.dest(dest))));

	if (!options.skipConsume) {
		consume(stream);
	}
	return stream;
};

function handleError(error) {
	const source = error.plugin || 'metal-tools-soy';
	console.error(new gutil.PluginError(source, error.message).toString());
	this.emit('end'); // jshint ignore:line
}
