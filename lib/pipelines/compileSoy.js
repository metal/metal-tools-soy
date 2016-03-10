'use strict';

var child_process = require('child_process');
var combiner = require('stream-combiner');
var defaultOptions = require('../options');
var fs = require('fs');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var ignore = require('gulp-ignore');
var merge = require('merge');
var path = require('path');
var soyparser = require('soyparser');
var through = require('through2');
var wrapper = require('gulp-wrapper');

var PATH_TO_JAR = require.resolve('closure-templates-incrementaldom/SoyToIncrementalDomSrcCompiler.jar');

var parsedSoys = {};
var templateData = {};

module.exports = function(options) {
	options = merge({}, defaultOptions, options);

	parsedSoys = {};
	templateData = {};

	return combiner(
		gulpif(!options.skipMetalGeneration, extractParams()),
		compileToIncDom(),
		ignore.exclude('*.soy'),
		gulpif(!options.skipMetalGeneration, wrapper({
			header: getHeaderContent,
			footer: getFooterContent
		}))
	);
};

function addTemplateParam(soyJsPath, templateName, param) {
	templateData[soyJsPath][templateName].params.push(param);
}

function compileToIncDom() {
	var files = [];
	return through.obj(
		function(file, encoding, callback) {
			files.push(file);
			callback();
		},
		function(callback) {
			var stream = this;
			var args = [
				'-jar',
				PATH_TO_JAR,
				'--outputPathFormat',
				path.join(__dirname, 'temp', '{INPUT_FILE_NAME}.js')
			].concat(files.map(function(singleFile) {
				return singleFile.path;
			}));

			var cp = child_process.spawn('java', args, {cwd: process.cwd()});
			cp.on('exit', function() {
				for (var i = 0; i < files.length; i++) {
					var realPath = path.join(__dirname, 'temp', path.basename(files[i].path)) + '.js';
					var compiled = new gutil.File({
	          base: files[i].base,
	          contents: fs.readFileSync(realPath),
	          cwd: files[i].cwd,
	          path: files[i].path + '.js'
	        });
					stream.emit('data', compiled);
				}
				stream.emit('end');
				callback();
			});
		}
	);
}

function extractParams() {
	return through.obj(function(file, encoding, callback) {
		var soyJsPath = file.relative + '.js';
		var parsed = getParsedSoy(soyJsPath, file.contents);

		templateData[soyJsPath] = {};
		parsed.templates.forEach(function(cmd) {
			if (cmd.deltemplate) {
				return;
			}

			var templateName = cmd.name;
			if (cmd.attributes.private === 'true') {
				templateData[soyJsPath][templateName] = {private: true};
				return;
			}

			var skippedUpdates = {};
			var staticSurface = false;
			cmd.docTags.forEach(function(docTag) {
				if (docTag.tag === 'skipUpdates') {
					docTag.description.split(/\s+/).forEach(function(skip) {
						skippedUpdates[skip] = true;
					});
				} else if (docTag.tag === 'static') {
					staticSurface = true;
				}
			});

			templateData[soyJsPath][templateName] = {params: [], static: staticSurface};
			cmd.params.forEach(function(tag) {
				if (!skippedUpdates[tag.name]) {
					addTemplateParam(soyJsPath, templateName, tag.name);
				}
			});
		});

		this.push(file);
		callback();
	});
}

function getFilenameNoLocale(filename) {
	return filename.replace(/_[^.]+\.soy/, '.soy');
}

function getFooterContent(file) {
	var footer = '';
	var pathNoLocale = getFilenameNoLocale(file.relative);
	var fileData = templateData[pathNoLocale];
	for (var templateName in fileData) {
		if (fileData[templateName].params) {
			footer += '\nexports.' + templateName + '.params = ' + JSON.stringify(fileData[templateName].params) + ';';
		}
		if (fileData[templateName].private) {
			footer += '\nexports.' + templateName + '.private = true;';
		}
		if (fileData[templateName].static) {
			footer += '\nexports.' + templateName + '.static = true;';
		}
	}

	var namespace = getParsedSoy(pathNoLocale, file.contents).namespace;
	var componentName = getNameFromNamespace(namespace);
	footer += '\n\nclass ' + componentName + ' extends Component {}\n' +
		componentName + '.RENDERER = SoyIncDomRenderer;\n' +
		'SoyTemplates.set(\'' + componentName + '\', exports);\n' +
		'SoyAop.registerTemplates(\'' + componentName + '\');\n' +
		'es6Exports = ' + componentName + ';\n' +
		'return exports;\n\n' +
		'});\n' +
		'export default es6Exports;\n';
	return footer + '/* jshint ignore:end */\n';
}

function getHeaderContent() {
	return '/* jshint ignore:start */\n' +
		'import Component from \'metal-component/src/Component\';\n' +
		'import SoyAop from \'metal-soy/src/SoyAop\';\n' +
		'import SoyIncDomRenderer from \'metal-soy-inc-dom-renderer/src/SoyIncDomRenderer\';\n' +
		'import SoyTemplates from \'metal-soy/src/SoyTemplates\';\n' +
		'var es6Exports;\n' +
		'goog.loadModule(function(exports) {\n\n';
}

function getNameFromNamespace(namespace) {
	var parts = namespace.split('.');
	return parts[parts.length - 1];
}

function getParsedSoy(soyJsPath, contents) {
	if (!parsedSoys[soyJsPath]) {
		parsedSoys[soyJsPath] = soyparser(contents);
	}
	return parsedSoys[soyJsPath];
}
