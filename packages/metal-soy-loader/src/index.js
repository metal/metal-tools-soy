import compileSoy from 'metal-tools-soy/lib/pipelines/compileSoy';
import fs from 'fs';
import glob from 'glob';
import loaderUtils from 'loader-utils';
import path from 'path';
import soyparser, { traverse } from 'soyparser';
import vfs from 'vinyl-fs';

const filePathAstMap = {};

const globs = {};

/**
 * metal-soy-loader
 */
export default function metalSoyLoader() {
	const loaderCallback = this.async();
	const loaderOptions = setDefaults(loaderUtils.getOptions(this));

	let resourcePath = this.resourcePath;

	if (path.extname(resourcePath) === '.js') {
		resourcePath = resourcePath.substring(0, resourcePath.indexOf('.js'));
	}

	const srcPaths = resolveGlob(loaderOptions.src);

	const externalCalls = getExternalSoyCalls(
		getParsedSoy(resourcePath),
		srcPaths,
	);

	const internalSoyDeps = resolveInternalSoyDeps(srcPaths, externalCalls);

	const soyDeps = loaderOptions.soyDeps.concat(internalSoyDeps);

	let stream = vfs.src(resourcePath).pipe(
		compileSoy({
			soyDeps,
		}).on('error', loaderCallback),
	);

	stream.on('data', file => {
		loaderCallback(null, file.contents.toString());
	});
}

/**
 * Gets namespaces of external soy calls
 * @param {!Object} soyAst parsed soy ast
 * @param {!Array} filePaths list of src file paths
 * @return {Array}
 */
function getExternalSoyCalls(soyAst, filePaths) {
	let calls = [];

	traverse.visit(soyAst, {
		Call: node => {
			if (node.id.namespace) {
				calls.push(node.id.namespace);
			}
		},
	});

	calls.forEach(namespace => {
		calls = getExternalSoyCalls(
			getParsedSoyByNamespace(namespace, filePaths),
			filePaths,
		).concat(calls);
	});

	return calls;
}

/**
 * Gets parsed soy ast
 * @param {!string} filePath
 * @return {Object}
 */
function getParsedSoy(filePath) {
	if (!filePathAstMap[filePath]) {
		const soyAst = soyparser(fs.readFileSync(filePath, 'utf8'));

		filePathAstMap[filePath] = soyAst;
	}
	return filePathAstMap[filePath];
}

/**
 * Gets parsed soy ast
 * @param {!string} filePath
 * @return {Object}
 */
function getParsedSoyByNamespace(namespace, filePaths) {
	let parsedSoy;

	filePaths.forEach(filePath => {
		const soyAst = getParsedSoy(filePath);

		if (soyAst.namespace === namespace) {
			parsedSoy = soyAst;
		}
	});

	return parsedSoy;
}

/**
 * Resolves glob file pattern
 * @param {!string} pattern file glob pattern
 * @return {Array} list of file paths
 */
function resolveGlob(pattern) {
	if (!globs[pattern]) {
		globs[pattern] = glob
			.sync(pattern)
			.map(filePath => path.resolve(filePath));
	}

	return globs[pattern];
}

/**
 * Resolves list of soy dependencies based on external soy calls
 * @param {!Array} filePaths array of file paths
 * @param {!Array} externalCalls array of soy namespaces
 */
function resolveInternalSoyDeps(filePaths, externalCalls) {
	return filePaths.filter(filePath => {
		const soyAst = getParsedSoy(filePath);

		return externalCalls.indexOf(soyAst.namespace) > -1;
	});
}

/**
 * Sets default loader options
 * @param {!Object} loaderOptions custom loader options passed from webpack config
 * @return {Object} loader options
 */
function setDefaults(loaderOptions) {
	loaderOptions = loaderOptions || {};

	loaderOptions.soyDeps =
		loaderOptions.soyDeps || 'node_modules/metal*/src/**/*.soy';
	loaderOptions.src = loaderOptions.src || 'src/**/*.soy';

	if (typeof loaderOptions.soyDeps === 'string') {
		loaderOptions.soyDeps = [loaderOptions.soyDeps];
	}

	return loaderOptions;
}
