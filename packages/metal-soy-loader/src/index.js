import fs from 'fs';
import glob from 'glob';
import metalsoy from 'metal-tools-soy';
import path from 'path';
import rimraf from 'rimraf';
import tmp from 'tmp';
import soyparser, { traverse } from 'soyparser';

const parsedSoy = {};

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

	const externalCalls = getExternalSoyCalls(getParsedSoy(resourcePath));

	const internalSoyDeps = resolveInternalSoyDeps(templates, externalCalls);

	soyDeps = soyDeps.concat(internalSoyDeps);

	metalsoy({
		dest: tmpDir.name,
		handleError,
		soyDeps,
		src: [resourcePath],
	}).on('end', handleEnd);
}

function getExternalSoyCalls(soyAst) {
	const calls = [];

	traverse.visit(soyAst, {
		Call: node => {
			if (node.id.namespace) {
				calls.push(node.id.namespace);
			}
		}
	});

	return calls;
}

function getParsedSoy(filePath) {
	if (!parsedSoy[filePath]) {
		parsedSoy[filePath] = soyparser(fs.readFileSync(filePath, 'utf8'));
	}
	return parsedSoy[filePath];
}

function resolveInternalSoyDeps(templates, externalCalls) {
	return templates.filter(
		filePath => {
			const soyAst = soyparser(fs.readFileSync(filePath, 'utf8'));

			return externalCalls.indexOf(soyAst.namespace) > -1;
		}
	)
}
