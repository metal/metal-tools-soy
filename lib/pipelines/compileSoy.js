'use strict';

const childProcess = require('child_process');
const combiner = require('stream-combiner');
const defaultOptions = require('../options');
const expand = require('glob-expand');
const fs = require('fs');
const gulpif = require('gulp-if');
const gutil = require('gulp-util');
const ignore = require('gulp-ignore');
const merge = require('merge');
const path = require('path');
const replace = require('gulp-replace');
const soyparser = require('soyparser').default;
const through = require('through2');
const wrapper = require('gulp-wrapper');

const PATH_TO_JAR = path.resolve(
	__dirname,
	'../../jar/soy-2017-04-23-SoyToIncrementalDomSrcCompiler.jar'
);

let parsedSoys = {};
let templateData = {};

const EXTERNAL_MSG_REGEX = /var (MSG_EXTERNAL_\d+(?:\$\$\d+)?) = goog\.getMsg\(\s*'([\w-\{\}\$]+)'\s*(?:,\s*\{([\s\S]+?)\})?\);/g;

const SOY_HEADER = `/* jshint ignore:start */
import Component from 'metal-component';
import Soy from 'metal-soy';

var templates;
goog.loadModule(function(exports) {
var soy = goog.require('soy');
var soydata = goog.require('soydata');
`;

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
		gulpif(
			!options.skipMetalGeneration,
			wrapper({
				header: getHeaderContent,
				footer: getFooterContent
			})
		),
		gulpif(!options.skipMetalGeneration, replaceTemplateRequires()),
		gulpif(
			!options.skipMetalGeneration && options.externalMsgFormat !== '',
			replace(
				EXTERNAL_MSG_REGEX,
				'var $1 = ' + options.externalMsgFormat + ';'
			)
		),
		through.obj()
	);
};

function buildSoyCompilerArgs(files, outputDir, soyDeps) {
	const args = [
		'-jar',
		PATH_TO_JAR,
		'--outputPathFormat',
		path.join(outputDir, '{INPUT_DIRECTORY}{INPUT_FILE_NAME}.js')
	].concat(
		files.map(function(singleFile) {
			return path.relative(process.cwd(), singleFile.path);
		})
	);

	if (soyDeps) {
		const expanded = expand(soyDeps);
		for (let i = 0; i < expanded.length; i++) {
			args.push('--deps', expanded[i]);
		}
	}
	return args;
}

function buildSoyCompilerError(errorMsg) {
	let msg = 'Compile error:\n';
	if (errorMsg.indexOf('UnsupportedClassVersionError') !== -1) {
		msg += 'Make sure that you have Java version 8 or higher installed.\n';
	}
	return new gutil.PluginError('metal-tools-soy', msg + errorMsg);
}

function compileToIncDom(options) {
	const files = [];
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
	const realPath = path.join(
		outputDir,
		path.relative(process.cwd(), file.path) + '.js'
	);
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
}

function extractTemplateData(soyData, template) {
	if (template.type !== 'DelTemplate') {
		let templateData = template.params.reduce(extractParamData, {
			params: [],
			types: {}
		});

		if (template.doc && template.doc.params) {
			templateData = template.doc.params.reduce(
				extractParamData,
				templateData
			);
		}

		let templateName = template.id.namespace
			? template.id.namespace + '.'
			: '';
		templateName += template.id.name;

		soyData[templateName] = templateData;
	}

	return soyData;
}

function extractParams() {
	return through.obj(function(file, encoding, callback) {
		try {
			const soyJsPath = file.relative + '.js';
			const parsed = getParsedSoy(soyJsPath, file.contents);

			templateData[soyJsPath] = parsed.body.reduce(
				extractTemplateData,
				{}
			);

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
	let footer = '';
	const fileData = templateData[file.relative];
	for (let templateName in fileData) {
		if (fileData[templateName].params) {
			footer +=
				'\nexports.' +
				templateName +
				'.params = ' +
				JSON.stringify(fileData[templateName].params) +
				';';
			footer +=
				'\nexports.' +
				templateName +
				'.types = ' +
				JSON.stringify(fileData[templateName].types) +
				';';
		}
	}

	const namespace = getParsedSoy(file.relative, file.contents).namespace;
	const componentName = getNameFromNamespace(namespace);
	footer += '\ntemplates = exports;\n' + 'return exports;\n\n' + '});\n\n';
	if (fileData.render) {
		footer +=
			'class ' +
			componentName +
			' extends Component {}\n' +
			'Soy.register(' +
			componentName +
			', templates);\n' +
			'export { ' +
			componentName +
			', templates };\n';
	} else {
		footer += 'export { templates };\n';
	}
	footer += 'export default templates;\n';
	return footer + '/* jshint ignore:end */\n';
}

function getHeaderContent() {
	return SOY_HEADER;
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
		let contents = file.contents.toString();

		const importMap = {};
		const requireRegex = /var\s+\$import(\d*)\s*=\s*goog\.require\('(\w+)\.incrementaldom'\);/g;
		contents = contents.replace(requireRegex, function(match, id, name) {
			importMap[id] = name;
			return '';
		});

		const importRegex = /\$import(\d*)\.(\w+)/g;
		contents = contents.replace(importRegex, function(
			match,
			id,
			methodName
		) {
			return `Soy.getTemplate('${importMap[id]}.incrementaldom', '${methodName}')`;
		});

		file.contents = new Buffer(contents);
		this.emit('data', file);
		callback();
	});
}

function runSoyCompiler(files, options, stream, callback) {
	const outputDir = options.outputDir;
	const args = buildSoyCompilerArgs(files, outputDir, options.soyDeps);

	const cp = childProcess.spawn('java', args, { cwd: process.cwd() });
	let stderr = '';
	cp.stderr.on('data', function(data) {
		stderr += data;
	});
	cp.on('exit', function(code) {
		if (code === 0) {
			for (let i = 0; i < files.length; i++) {
				stream.emit(
					'data',
					createCompiledGulpFile(files[i], outputDir)
				);
			}
		} else {
			stream.emit('error', buildSoyCompilerError(stderr));
		}
		stream.emit('end');
		callback();
	});
}
