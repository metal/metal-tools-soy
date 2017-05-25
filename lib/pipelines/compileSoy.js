'use strict';

var childProcess = require('child_process');
var combiner = require('stream-combiner');
var defaultOptions = require('../options');
var expand = require('glob-expand');
var fs = require('fs');
var gulpif = require('gulp-if');
var gutil = require('gulp-util');
var ignore = require('gulp-ignore');
var merge = require('merge');
var path = require('path');
var replace = require('gulp-replace');
var soyparser = require('soyparser').default;
var through = require('through2');
var wrapper = require('gulp-wrapper');

var PATH_TO_JAR = path.resolve(__dirname, '../../jar/soy-2017-04-23-SoyToIncrementalDomSrcCompiler.jar');

var parsedSoys = {};
var templateData = {};

const EXTERNAL_MSG_REGEX = /var (MSG_EXTERNAL_\d+(?:\$\$\d+)?) = goog\.getMsg\(\s*'([\w-\{\}\$]+)'\s*(?:,\s*\{([\s\S]+?)\})?\);/g;

module.exports = function(options) {
	options = merge({}, defaultOptions, options);

	parsedSoys = {};
	templateData = {};

	return combiner(
		gulpif(!options.skipMetalGeneration, extractParams()),
		compileToIncDom(options),
		ignore.exclude('*.soy'),
		// Changes compiled soy files to use return value of `goog.require`, so we
		// don't need to have `soy` be a global variable.
		gulpif(!options.skipMetalGeneration, replace('goog.require(\'soy\')', 'var soy = goog.require(\'soy\')')),
		gulpif(!options.skipMetalGeneration, replace('goog.require(\'soydata\')', 'var soydata = goog.require(\'soydata\')')),
		gulpif(!options.skipMetalGeneration, wrapper({
			header: getHeaderContent,
			footer: getFooterContent
		})),
		gulpif(!options.skipMetalGeneration, replaceTemplateRequires()),
		gulpif(!options.skipMetalGeneration && options.externalMsgFormat !== '', replace(EXTERNAL_MSG_REGEX, 'var $1 = ' + options.externalMsgFormat + ';'))
	);
};

function buildSoyCompilerArgs(files, outputDir, soyDeps) {
	var args = [
		'-jar',
		PATH_TO_JAR,
		'--outputPathFormat',
		path.join(outputDir, '{INPUT_DIRECTORY}{INPUT_FILE_NAME}.js')
	].concat(files.map(function(singleFile) {
		return path.relative(process.cwd(), singleFile.path);
	}));

	if (soyDeps) {
		var expanded = expand(soyDeps);
		for (var i = 0; i < expanded.length; i++) {
			args.push('--deps', expanded[i]);
		}
	}
	return args;
}

function buildSoyCompilerError(errorMsg) {
	var msg = 'Compile error:\n';
	if (errorMsg.indexOf('UnsupportedClassVersionError') !== -1) {
		msg += 'Make sure that you have Java version 8 or higher installed.\n';
	}
	return new gutil.PluginError('metal-tools-soy', msg + errorMsg);
}

function compileToIncDom(options) {
	var files = [];
	return through.obj(
		function(file, encoding, callback) {
			files.push(file);
			callback();
		},
		function(callback) {
			if (files.length === 0) {
				this.emit('end');
				callback();
				return;
			}
			runSoyCompiler(files, options, this, callback);
		}
	);
}

function createCompiledGulpFile(file, outputDir) {
	var realPath = path.join(outputDir, path.relative(process.cwd(), file.path) + '.js');
	return new gutil.File({
		base: file.base,
		contents: fs.readFileSync(realPath),
		cwd: file.cwd,
		path: file.path + '.js'
	});
}

function extractParamData(paramData, param) {
	paramData.params.push(param.name);
	paramData.types[param.name] = param.paramType;

	return paramData;
};

function extractTemplateData(soyData, template) {
	if (template.type !== 'DelTemplate') {
		var templateData = template.params.reduce(
			extractParamData,
			{
				params: [],
				types: {}
			}
		);

		if (template.doc && template.doc.params) {
			templateData = template.doc.params.reduce(extractParamData, templateData);
		}

		var templateName = template.id.namespace ? template.id.namespace + '.' : '';
		templateName += template.id.name;

		soyData[templateName] = templateData;
	}

	return soyData;
};

function extractParams() {
	return through.obj(function(file, encoding, callback) {
		try {
			var soyJsPath = file.relative + '.js';
			var parsed = getParsedSoy(soyJsPath, file.contents);

			templateData[soyJsPath] = parsed.body.reduce(extractTemplateData, {});

			this.push(file);
		} catch (e) {
			this.emit('error', new gutil.PluginError('metal-tools-soy', e));
			this.emit('end');
		} finally {
			callback();
		}
	});
}

function getFooterContent(file) {
	var footer = '';
	var fileData = templateData[file.relative];
	for (var templateName in fileData) {
		if (fileData[templateName].params) {
			footer += '\nexports.' + templateName + '.params = ' + JSON.stringify(fileData[templateName].params) + ';';
			footer += '\nexports.' + templateName + '.types = ' + JSON.stringify(fileData[templateName].types) + ';';
		}
	}

	var namespace = getParsedSoy(file.relative, file.contents).namespace;
	var componentName = getNameFromNamespace(namespace);
	footer += '\ntemplates = exports;\n' +
		'return exports;\n\n' +
		'});\n\n';
	if (fileData.render) {
		footer += 'class ' + componentName + ' extends Component {}\n' +
			'Soy.register(' + componentName + ', templates);\n' +
			'export { ' + componentName + ', templates };\n';
	} else {
		footer += 'export { templates };\n';
	}
	footer += 'export default templates;\n';
	return footer + '/* jshint ignore:end */\n';
}

function getHeaderContent() {
	return '/* jshint ignore:start */\n' +
		'import Component from \'metal-component\';\n' +
		'import Soy from \'metal-soy\';\n' +
		'var templates;\n' +
		'goog.loadModule(function(exports) {\n\n';
}

function getNameFromNamespace(namespace) {
	return namespace.split('.').join('');
}

function getParsedSoy(soyJsPath, contents) {
	if (!parsedSoys[soyJsPath]) {
		parsedSoys[soyJsPath] = soyparser(contents.toString());
	}
	return parsedSoys[soyJsPath];
}

function replaceTemplateRequires() {
	return through.obj(function(file, encoding, callback) {
		var contents = file.contents.toString();

		var importMap = {};
		var requireRegex = /var\s+\$import(\d*)\s*=\s*goog\.require\('(\w+)\.incrementaldom'\);/g;
		contents = contents.replace(requireRegex, function(match, id, name) {
			importMap[id] = name;
			return '';
		});

		var importRegex = /\$import(\d*)\.(\w+)/g;
		contents = contents.replace(importRegex, function(match, id, methodName) {
			return 'Soy.getTemplate(\'' + importMap[id] + '.incrementaldom\', \'' + methodName + '\')';
		});

		file.contents = new Buffer(contents);
		this.emit('data', file);
		callback();
	});
}

function runSoyCompiler(files, options, stream, callback) {
	var outputDir = options.outputDir;
	var args = buildSoyCompilerArgs(files, outputDir, options.soyDeps);

	var cp = childProcess.spawn('java', args, {cwd: process.cwd()});
	var stderr = '';
	cp.stderr.on('data', function(data) {
		stderr += data;
	});
	cp.on('exit', function(code) {
		if (code === 0) {
			for (var i = 0; i < files.length; i++) {
				stream.emit('data', createCompiledGulpFile(files[i], outputDir));
			}
		} else {
			stream.emit('error', buildSoyCompilerError(stderr));
		}
		stream.emit('end');
		callback();
	});
}
