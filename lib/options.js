'use strict';

var os = require('os');
var path = require('path');

module.exports = {
	dest: 'src',
	externalMsgFormat: '',
	outputDir: os.tmpdir() + path.sep + 'metal-tools-soy',
	skipMetalGeneration: false,
	soyDeps: 'node_modules/metal*/src/**/*.soy',
	src: 'src/**/*.soy'
};
