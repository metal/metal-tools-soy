'use strict';

var combiner = require('stream-combiner');
var defaultOptions = require('../options');
var gulpif = require('gulp-if');
var ignore = require('gulp-ignore');
var merge = require('merge');
var soynode = require('gulp-soynode');
var soyparser = require('soyparser');
var through = require('through2');
var wrapper = require('gulp-wrapper');

var parsedSoys = {};
var templateData = {};

module.exports = function(options) {
	options = merge({}, defaultOptions, options);

	parsedSoys = {};
	templateData = {};

	return combiner(
		gulpif(!options.skipMetalGeneration, extractParams()),
		soynode({
			loadCompiledTemplates: false,
			locales: options.soyLocales,
			messageFilePathFormat: options.soyMessageFilePathFormat
		}),
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

function extractParams() {
	return through.obj(function(file, encoding, callback) {
		var soyJsPath = file.relative + '.js';
		var parsed = getParsedSoy(soyJsPath, file.contents);
		var namespace = parsed.namespace;

		templateData[soyJsPath] = {};
		parsed.templates.forEach(function(cmd) {
			if (cmd.deltemplate) {
				return;
			}

			var templateName = namespace + '.' + cmd.name;
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
			footer += '\n' + templateName + '.params = ' + JSON.stringify(fileData[templateName].params) + ';';
		}
		if (fileData[templateName].private) {
			footer += '\n' + templateName + '.private = true;';
		}
		if (fileData[templateName].static) {
			footer += '\n' + templateName + '.static = true;';
		}
	}

	var namespace = getParsedSoy(pathNoLocale, file.contents).namespace;
	if (namespace.indexOf('Templates.') === 0) {
		var componentName = namespace.substr(10);
		footer += '\n\nclass ' + componentName + ' extends Component {}\n' +
			componentName + '.RENDERER = SoyRenderer;\n' +
			'SoyAop.registerTemplates(\'' + componentName + '\');\n' +
			'export default ' + componentName + ';\n';
	} else {
		console.warn(
			'Found soy file with unsupported namespace. No component will be generated ' +
			'for this file. Metal.js soy files should always be of the form: ' +
			'"Templates.<ComponentName>". '
		);
	}
	return footer + '/* jshint ignore:end */\n';
}

function getHeaderContent() {
	return '/* jshint ignore:start */\n' +
		'import Component from \'metal-component/src/Component\';\n' +
		'import SoyAop from \'metal-soy/src/SoyAop\';\n' +
		'import SoyRenderer from \'metal-soy/src/SoyRenderer\';\n' +
		'import SoyTemplates from \'metal-soy/src/SoyTemplates\';\n' +
		'var Templates = SoyTemplates.get();\n';
}

function getParsedSoy(soyJsPath, contents) {
	if (!parsedSoys[soyJsPath]) {
		parsedSoys[soyJsPath] = soyparser(contents);
	}
	return parsedSoys[soyJsPath];
}
