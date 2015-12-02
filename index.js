'use strict';

var compileSoy = require('./lib/pipelines/compileSoy');
var consume = require('stream-consume');
var vfs = require('vinyl-fs');

module.exports = function (options) {
	options  = options || {};
	var stream = vfs.src(options.src || 'src/**/*.soy')
		.pipe(compileSoy.pipeline(options))
		.pipe(vfs.dest(options.dest || 'src'));
	consume(stream);
	return stream;
};
module.exports.pipelines = {
	compileSoy: compileSoy.pipeline
};
