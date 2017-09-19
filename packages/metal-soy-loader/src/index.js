import compileSoy from 'metal-tools-soy/lib/pipelines/compileSoy';
import fs from 'fs';
import glob from 'glob';
import path from 'path';
import soyparser, { traverse } from 'soyparser';
import vfs from 'vinyl-fs';

const filePathAstMap = {};

const globs = {};

const namespaceAstMap = {};

/**
 * metal-soy-loader
 */
export default function() {
	const loaderCallback = this.async();

	let resourcePath = this.resourcePath;

	if (path.extname(resourcePath) === '.js') {
		resourcePath = resourcePath.substring(0, resourcePath.indexOf('.js'));
	}

	const templates = resolveGlob('**/*.soy');

	let soyDeps = templates.filter(filePath => /node_modules/.test(filePath));

	templates.forEach(filePath => {
		getParsedSoy(filePath);
	});

	/**
	* @param error
	* @param result
	*/
	const handleEnd = (error, result) => {
		loaderCallback(error, result);
	};

	/**
	 * @param error
	 */
	const handleError = error => {
		handleEnd(error);
	};

	const externalCalls = getExternalSoyCalls(
		getParsedSoy(resourcePath),
		namespaceAstMap,
	);

	const internalSoyDeps = resolveInternalSoyDeps(templates, externalCalls);

	soyDeps = soyDeps.concat(internalSoyDeps);

	let stream = vfs.src(resourcePath).pipe(
		compileSoy({
			soyDeps,
		}).on('error', handleError),
	);

	stream.on('data', file => {
		handleEnd(null, file.contents.toString());
	});
	stream.on('error', handleError);
}

function getExternalSoyCalls(soyAst, namespaceAstMap) {
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
			namespaceAstMap[namespace],
			namespaceAstMap,
		).concat(calls);
	});

	return calls;
}

function getParsedSoy(filePath) {
	if (!filePathAstMap[filePath]) {
		const soyAst = soyparser(fs.readFileSync(filePath, 'utf8'));

		filePathAstMap[filePath] = soyAst;
		namespaceAstMap[soyAst.namespace] = soyAst;
	}
	return filePathAstMap[filePath];
}

function resolveGlob(pattern) {
	if (!globs[pattern]) {
		globs[pattern] = glob
			.sync(pattern)
			.map(filePath => path.resolve(filePath));
	}

	return globs[pattern];
}

function resolveInternalSoyDeps(templates, externalCalls) {
	return templates.filter(filePath => {
		const soyAst = getParsedSoy(filePath);

		return externalCalls.indexOf(soyAst.namespace) > -1;
	});
}
