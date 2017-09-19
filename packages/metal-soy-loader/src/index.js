import fs from 'fs';
import glob from 'glob';
import metalsoy from 'metal-tools-soy';
import path from 'path';
import rimraf from 'rimraf';
import tmp from 'tmp';
import soyparser, { traverse } from 'soyparser';

const filePathAstMap = {};
const namespaceAstMap = {};

/**
 * metal-soy-loader
 */
export default function() {
	const loaderCallback = this.async();
	const tmpDir = tmp.dirSync();

	let resourcePath = this.resourcePath;

	if (path.extname(resourcePath) === '.js') {
		resourcePath = resourcePath.substring(0, resourcePath.indexOf('.js'));
	}

	const templates = glob
		.sync('**/*.soy')
		.map(filePath => path.resolve(filePath));

	let soyDeps = templates.filter(filePath => /node_modules/.test(filePath));

	templates.forEach(filePath => {
		getParsedSoy(filePath);
	});

	/**
	* Handles the compilation end.
	* Emits an error if there where a problem during the compilation
	* process or if there is no result file.
	* @param error
	*/
	const handleEnd = error => {
		let result = '';

		if (!error) {
			try {
				result = fs.readFileSync(
					`${tmpDir.name}/${path.basename(resourcePath)}.js`,
					'utf-8',
				);
			} catch (e) {
				error = e;
			}
		}

		rimraf.sync(tmpDir.name);
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

	metalsoy({
		dest: tmpDir.name,
		handleError,
		soyDeps,
		src: [resourcePath],
	}).on('end', handleEnd);
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

function resolveInternalSoyDeps(templates, externalCalls) {
	return templates.filter(filePath => {
		const soyAst = getParsedSoy(filePath);

		return externalCalls.indexOf(soyAst.namespace) > -1;
	});
}
