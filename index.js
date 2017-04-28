'use strict';

var compileSoy = require('./lib/pipelines/compileSoy');
var consume = require('stream-consume');
var defaultOptions = require('./lib/options');
var gutil = require('gulp-util');
var merge = require('merge');
var vfs = require('vinyl-fs');

module.exports = function (options) {
	options = merge({
		handleError: handleError
	}, defaultOptions, options);

	if (!Array.isArray(options.dest)) {
		options.dest = [options.dest];
	}

	var stream = vfs.src(options.src)
		.pipe(compileSoy(options).on('error', options.handleError));

	options.dest.forEach((dest) => stream = stream.pipe(vfs.dest(dest)));

	if (!options.skipConsume) {
		consume(stream);
	}
	return stream;
};

function handleError(error) {
	var source = error.plugin || 'metal-tools-soy';
	console.error(new gutil.PluginError(source, error.message).toString());
	this.emit('end'); // jshint ignore:line
}
